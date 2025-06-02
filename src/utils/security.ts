import { UserRole } from '../types/auth';

// Security constants
export const SECURITY_CONFIG = {
  // Admin email - this should be the only hardcoded admin
  ADMIN_EMAIL: 'arindamdawn3@gmail.com',
  
  // Session timeout (in milliseconds)
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPT_WINDOW: 15 * 60 * 1000, // 15 minutes
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
} as const;

// Role-based permissions
export const ROLE_PERMISSIONS = {
  admin: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'menu:read',
    'menu:create',
    'menu:update',
    'menu:delete',
    'orders:read',
    'orders:create',
    'orders:update',
    'orders:delete',
    'reports:read',
    'settings:read',
    'settings:update',
    'receipt:read',
    'receipt:update',
    'categories:read',
    'categories:create',
    'categories:update',
    'categories:delete',
  ],
  volunteer: [
    'orders:read',
    'orders:create',
    'menu:read',
    'categories:read',
  ],
  kitchen: [
    'orders:read',
    'orders:update',
    'menu:read',
    'categories:read',
  ],
} as const;

// Permission checking utility
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.includes(permission as any);
};

// Check if user can access a specific resource
export const canAccessResource = (userRole: UserRole, resource: string, action: string): boolean => {
  const permission = `${resource}:${action}`;
  return hasPermission(userRole, permission);
};

// Validate user role
export const isValidRole = (role: string): role is UserRole => {
  return ['admin', 'volunteer', 'kitchen'].includes(role);
};

// Check if user is admin
export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === 'admin';
};

// Check if user can manage other users
export const canManageUsers = (userRole: UserRole): boolean => {
  return hasPermission(userRole, 'users:create') && hasPermission(userRole, 'users:delete');
};

// Sanitize user input
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const isValidPassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters long`);
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate secure random ID
export const generateSecureId = (): string => {
  return crypto.randomUUID();
};

// Rate limiting utility
class RateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number }> = new Map();
  
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return false;
    }
    
    // Reset if window has passed
    if (now - record.firstAttempt > SECURITY_CONFIG.LOGIN_ATTEMPT_WINDOW) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return false;
    }
    
    // Check if rate limited
    if (record.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      return true;
    }
    
    // Increment attempt count
    record.count++;
    return false;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter();

// Audit logging utility
export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: any;
}

class AuditLogger {
  private logs: AuditLog[] = [];
  
  log(entry: Omit<AuditLog, 'timestamp'>): void {
    const auditEntry: AuditLog = {
      ...entry,
      timestamp: new Date(),
    };
    
    this.logs.push(auditEntry);
    
    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('🔒 Audit Log:', auditEntry);
    }
  }
  
  getLogs(): AuditLog[] {
    return [...this.logs];
  }
  
  getLogsForUser(userId: string): AuditLog[] {
    return this.logs.filter(log => log.userId === userId);
  }
}

export const auditLogger = new AuditLogger();

// Session validation utility
export const isSessionValid = (sessionCreatedAt: Date): boolean => {
  const now = Date.now();
  const sessionAge = now - sessionCreatedAt.getTime();
  return sessionAge < SECURITY_CONFIG.SESSION_TIMEOUT;
};

// Error sanitization - remove sensitive information from errors
export const sanitizeError = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    // Remove sensitive information from error messages
    return error.message
      .replace(/password/gi, '[REDACTED]')
      .replace(/token/gi, '[REDACTED]')
      .replace(/key/gi, '[REDACTED]');
  }
  
  return 'An unexpected error occurred';
};
