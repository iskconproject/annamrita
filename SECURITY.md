# Security Implementation Guide

## Overview

This document outlines the production-grade Role-Based Access Control (RBAC) and security measures implemented in the Annamrita POS system.

## Security Features Implemented

### 1. Enhanced Authentication & Authorization

#### Role-Based Access Control (RBAC)
- **Admin**: Full system access (users, menu, reports, settings)
- **Volunteer**: Order management and basic operations
- **Kitchen**: Order viewing and status updates

#### Permission System
- Granular permissions for each resource and action
- Server-side role validation from database
- Client-side route protection with audit logging

### 2. Security Services

#### SecureUserService
- Server-side user role validation
- Permission checking before operations
- Secure user creation with validation
- Admin-only user deletion with safeguards
- Audit logging for all user operations

#### SecureAuthService
- Enhanced login with rate limiting
- Session validation with database role lookup
- Automatic admin user creation for primary admin
- Comprehensive error handling and logging

### 3. Security Middleware

#### SecurityMiddleware
- Input validation and sanitization
- Rate limiting protection
- Suspicious activity detection
- Resource ownership validation
- Security event logging

### 4. Enhanced Route Protection

#### ProtectedRoute Components
- `AdminRoute`: Admin-only access
- `VolunteerRoute`: Volunteer+ access (volunteer, kitchen, admin)
- `KitchenRoute`: Kitchen+ access (kitchen, admin)
- Audit logging for access attempts
- Loading states during permission checks

### 5. Input Validation & Sanitization

#### Zod Schemas
- Enhanced validation with security rules
- Character limits and regex patterns
- SQL injection prevention
- XSS protection through input sanitization

#### Validation Rules
- Menu items: Name, price, category validation
- Users: Email, password strength, role validation
- Orders: Item limits, total validation
- Search: Query sanitization

### 6. Audit Logging

#### Comprehensive Logging
- All authentication events
- Permission checks and denials
- User management operations
- Route access attempts
- Security events and violations

#### Log Structure
```typescript
interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  success: boolean;
  details?: any;
}
```

### 7. Rate Limiting

#### Login Protection
- Maximum 5 attempts per email in 15 minutes
- Automatic lockout with clear error messages
- Reset on successful authentication

#### API Protection
- Configurable rate limits per endpoint
- In-memory storage (Redis recommended for production)
- User-specific and IP-based limiting

### 8. Security Utilities

#### Password Security
- Minimum 8 characters
- Uppercase, lowercase, number, special character required
- Password strength validation
- Secure password hashing (handled by Appwrite)

#### Data Sanitization
- HTML tag removal
- Length limitations
- Special character filtering
- SQL injection prevention

### 9. Error Handling

#### Secure Error Messages
- Sensitive information removal
- User-friendly error messages
- Detailed logging for debugging
- Error classification (Security, Permission, Validation)

## Security Configuration

### Environment Variables
```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id
# ... other collection IDs
```

### Security Constants
```typescript
export const SECURITY_CONFIG = {
  ADMIN_EMAIL: 'arindamdawn3@gmail.com',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPT_WINDOW: 15 * 60 * 1000, // 15 minutes
  MIN_PASSWORD_LENGTH: 8,
};
```

## Implementation Details

### 1. User Role Determination
- Primary admin determined by hardcoded email
- Other users' roles stored in database
- Server-side validation on every request
- Fallback to volunteer role for missing records

### 2. Permission Matrix
```typescript
const ROLE_PERMISSIONS = {
  admin: ['users:*', 'menu:*', 'orders:*', 'reports:*', 'settings:*'],
  volunteer: ['orders:read', 'orders:create', 'menu:read'],
  kitchen: ['orders:read', 'orders:update', 'menu:read'],
};
```

### 3. Database Security
- User roles stored in separate collection
- Permission validation before database operations
- Input sanitization before queries
- Audit trail for all modifications

## Security Best Practices Implemented

### 1. Defense in Depth
- Multiple layers of security checks
- Client-side and server-side validation
- Database-level permissions
- Audit logging at every level

### 2. Principle of Least Privilege
- Users only get minimum required permissions
- Role-based access restrictions
- Resource-specific permissions
- Time-limited sessions

### 3. Secure by Default
- Registration disabled by default
- Admin-only user creation
- Secure password requirements
- Comprehensive input validation

### 4. Monitoring & Alerting
- Comprehensive audit logging
- Suspicious activity detection
- Security event classification
- Real-time monitoring capabilities

## Production Deployment Checklist

### 1. Environment Security
- [ ] Secure environment variables
- [ ] HTTPS enforcement
- [ ] Database connection security
- [ ] API key rotation

### 2. Appwrite Configuration
- [ ] Database permissions configured
- [ ] Collection-level security rules
- [ ] User authentication settings
- [ ] Session management configuration

### 3. Monitoring Setup
- [ ] Audit log storage
- [ ] Security event alerting
- [ ] Performance monitoring
- [ ] Error tracking

### 4. Backup & Recovery
- [ ] Database backup strategy
- [ ] User data protection
- [ ] Disaster recovery plan
- [ ] Security incident response

## Security Testing

### 1. Authentication Testing
- [ ] Login rate limiting
- [ ] Session validation
- [ ] Password strength enforcement
- [ ] Role-based access control

### 2. Authorization Testing
- [ ] Route protection
- [ ] API endpoint security
- [ ] Permission validation
- [ ] Resource access control

### 3. Input Validation Testing
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Data sanitization
- [ ] File upload security

### 4. Security Monitoring
- [ ] Audit log functionality
- [ ] Suspicious activity detection
- [ ] Error handling
- [ ] Security event logging

## Maintenance

### 1. Regular Security Updates
- Update dependencies regularly
- Monitor security advisories
- Review and update permissions
- Audit user access regularly

### 2. Security Reviews
- Quarterly security assessments
- Code security reviews
- Penetration testing
- Vulnerability assessments

### 3. Incident Response
- Security incident procedures
- Breach notification process
- Recovery procedures
- Post-incident analysis

## Contact

For security-related questions or to report vulnerabilities, please contact the development team.

---

**Note**: This security implementation follows industry best practices and provides production-grade security for the Annamrita POS system. Regular security reviews and updates are recommended to maintain security posture.
