import { User } from '../types/auth';
import {
  canAccessResource,
  auditLogger,
  sanitizeError,
  sanitizeInput
} from '../utils/security';
import { SecurityError, PermissionError, ValidationError } from '../services/secureApi';

// Security middleware for API operations
export class SecurityMiddleware {

  // Validate user has permission for an operation
  static validatePermission(user: User | null, resource: string, action: string): void {
    if (!user) {
      throw new SecurityError('Authentication required');
    }

    if (!canAccessResource(user.role, resource, action)) {
      auditLogger.log({
        userId: user.id,
        action: 'permission_denied',
        resource: `${resource}:${action}`,
        success: false,
        details: { userRole: user.role }
      });

      throw new PermissionError(`Insufficient permissions for ${resource}:${action}`);
    }

    auditLogger.log({
      userId: user.id,
      action: 'permission_granted',
      resource: `${resource}:${action}`,
      success: true,
      details: { userRole: user.role }
    });
  }

  // Validate and sanitize input data
  static validateInput(data: Record<string, any>, rules: Record<string, (value: any) => boolean>): Record<string, any> {
    const sanitizedData: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitizedData[key] = sanitizeInput(value);
      } else {
        sanitizedData[key] = value;
      }

      // Apply validation rules if provided
      if (rules[key] && !rules[key](sanitizedData[key])) {
        throw new ValidationError(`Invalid value for field: ${key}`);
      }
    }

    return sanitizedData;
  }

  // Check if user can modify a specific resource
  static canModifyResource(user: User, resourceOwnerId?: string): boolean {
    // Admin can modify anything
    if (user.role === 'admin') {
      return true;
    }

    // Users can only modify their own resources
    if (resourceOwnerId && user.id === resourceOwnerId) {
      return true;
    }

    return false;
  }

  // Rate limiting check
  static checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
    // This is a simple in-memory rate limiter
    // In production, you'd want to use Redis or similar
    const now = Date.now();
    const key = `rate_limit_${identifier}`;

    if (!SecurityMiddleware.rateLimitStore) {
      SecurityMiddleware.rateLimitStore = new Map();
    }

    const record = SecurityMiddleware.rateLimitStore.get(key);

    if (!record) {
      SecurityMiddleware.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (now > record.resetTime) {
      SecurityMiddleware.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  private static rateLimitStore: Map<string, { count: number; resetTime: number }>;

  // Validate menu item data
  static validateMenuItemData(data: any): void {
    const rules = {
      name: (value: string) => value.length >= 2 && value.length <= 100,
      shortName: (value: string) => value.length >= 1 && value.length <= 20,
      category: (value: string) => value.length >= 1 && value.length <= 50,
      price: (value: number) => value >= 0 && value <= 10000,
      available: (value: boolean) => typeof value === 'boolean'
    };

    this.validateInput(data, rules);
  }

  // Validate user data
  static validateUserData(data: any): void {
    const rules = {
      name: (value: string) => value.length >= 1 && value.length <= 100,
      email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      role: (value: string) => ['admin', 'volunteer', 'kitchen'].includes(value)
    };

    this.validateInput(data, rules);
  }

  // Validate order data
  static validateOrderData(data: any): void {
    const rules = {
      items: (value: any[]) => Array.isArray(value) && value.length > 0,
      total: (value: number) => value >= 0 && value <= 100000,
      phoneNumber: (value: string) => !value || /^\+?[\d\s-()]+$/.test(value)
    };

    this.validateInput(data, rules);
  }

  // Security headers for responses
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    };
  }

  // Log security event
  static logSecurityEvent(
    userId: string,
    event: string,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    auditLogger.log({
      userId,
      action: 'security_event',
      resource: event,
      success: false,
      details: {
        severity,
        event,
        ...details,
        timestamp: new Date().toISOString()
      }
    });

    // In production, you might want to send critical events to external monitoring
    if (severity === 'critical') {
      console.error('🚨 CRITICAL SECURITY EVENT:', {
        userId,
        event,
        details,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Check for suspicious activity patterns
  static detectSuspiciousActivity(userId: string, action: string): boolean {
    // This is a basic implementation - in production you'd want more sophisticated detection
    const recentLogs = auditLogger.getLogsForUser(userId)
      .filter(log => Date.now() - log.timestamp.getTime() < 5 * 60 * 1000); // Last 5 minutes

    // Check for rapid repeated failed actions
    const failedActions = recentLogs.filter(log => !log.success && log.action === action);
    if (failedActions.length >= 5) {
      this.logSecurityEvent(userId, 'rapid_failed_attempts', {
        action,
        attemptCount: failedActions.length
      }, 'high');
      return true;
    }

    // Check for unusual access patterns
    const uniqueResources = new Set(recentLogs.map(log => log.resource));
    if (uniqueResources.size >= 10) {
      this.logSecurityEvent(userId, 'unusual_access_pattern', {
        resourceCount: uniqueResources.size,
        timeWindow: '5 minutes'
      }, 'medium');
      return true;
    }

    return false;
  }
}

// Decorator for securing API methods
export function SecureOperation(resource: string, action: string) {
  return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // Assume first argument is user context
        const user = args[0] as User;

        // Validate permissions
        SecurityMiddleware.validatePermission(user, resource, action);

        // Check for suspicious activity
        if (SecurityMiddleware.detectSuspiciousActivity(user.id, `${resource}:${action}`)) {
          throw new SecurityError('Suspicious activity detected. Please try again later.');
        }

        // Call the original method
        return await method.apply(this, args);

      } catch (error) {
        // Log the error
        auditLogger.log({
          userId: args[0]?.id || 'unknown',
          action: `${resource}:${action}`,
          resource: resource,
          success: false,
          details: { error: sanitizeError(error) }
        });

        throw error;
      }
    };

    return descriptor;
  };
}
