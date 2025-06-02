import { databases, account, DATABASE_ID, USERS_COLLECTION_ID } from './appwrite';
import { User, UserRole } from '../types/auth';
import { ID, Query } from 'appwrite';
import {
  canAccessResource,
  isValidRole,
  sanitizeInput,
  isValidEmail,
  isValidPassword,
  auditLogger,
  sanitizeError,
  SECURITY_CONFIG
} from '../utils/security';

// Enhanced error types
export class SecurityError extends Error {
  constructor(message: string, public code: string = 'SECURITY_ERROR') {
    super(message);
    this.name = 'SecurityError';
  }
}

export class PermissionError extends SecurityError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'PERMISSION_DENIED');
    this.name = 'PermissionError';
  }
}

export class ValidationError extends SecurityError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// Secure user operations
export class SecureUserService {

  // Get user role from database (server-side validation)
  static async getUserRole(userId: string): Promise<UserRole> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      if (response.documents.length === 0) {
        throw new SecurityError('User not found in database');
      }

      const userDoc = response.documents[0];
      const role = userDoc.role;

      if (!isValidRole(role)) {
        throw new SecurityError('Invalid user role in database');
      }

      return role as UserRole;
    } catch (error) {
      auditLogger.log({
        userId,
        action: 'get_user_role',
        resource: 'user',
        success: false,
        details: { error: sanitizeError(error) }
      });
      throw error;
    }
  }

  // Validate user permissions for an action
  static async validatePermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const userRole = await this.getUserRole(userId);
      const hasAccess = canAccessResource(userRole, resource, action);

      auditLogger.log({
        userId,
        action: 'permission_check',
        resource: `${resource}:${action}`,
        success: hasAccess,
        details: { userRole, hasAccess }
      });

      return hasAccess;
    } catch (error) {
      auditLogger.log({
        userId,
        action: 'permission_check',
        resource: `${resource}:${action}`,
        success: false,
        details: { error: sanitizeError(error) }
      });
      return false;
    }
  }

  // Create user with proper validation
  static async createUser(
    currentUserId: string,
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<User> {
    try {
      // Validate current user permissions
      const canCreate = await this.validatePermission(currentUserId, 'users', 'create');
      if (!canCreate) {
        throw new PermissionError('You do not have permission to create users');
      }

      // Validate input
      if (!isValidEmail(email)) {
        throw new ValidationError('Invalid email format');
      }

      const passwordValidation = isValidPassword(password);
      if (!passwordValidation.isValid) {
        throw new ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      if (!isValidRole(role)) {
        throw new ValidationError('Invalid user role');
      }

      // Sanitize inputs
      const sanitizedName = sanitizeInput(name);
      const sanitizedEmail = sanitizeInput(email);

      // Check if user already exists
      const existingUsers = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal('email', sanitizedEmail)]
      );

      if (existingUsers.documents.length > 0) {
        throw new ValidationError('User with this email already exists');
      }

      // Only admin can create admin users
      const currentUserRole = await this.getUserRole(currentUserId);
      if (role === 'admin' && currentUserRole !== 'admin') {
        throw new PermissionError('Only administrators can create admin users');
      }

      // Create user in Appwrite auth
      const authResponse = await account.create(
        ID.unique(),
        sanitizedEmail,
        password,
        sanitizedName
      );

      // Store user details with role in database
      await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        ID.unique(),
        {
          userId: authResponse.$id,
          email: sanitizedEmail,
          name: sanitizedName,
          role: role,
          createdBy: currentUserId,
          createdAt: new Date().toISOString(),
        }
      );

      const newUser: User = {
        id: authResponse.$id,
        email: sanitizedEmail,
        name: sanitizedName,
        role: role,
      };

      auditLogger.log({
        userId: currentUserId,
        action: 'create_user',
        resource: 'user',
        success: true,
        details: {
          createdUserId: newUser.id,
          createdUserEmail: newUser.email,
          createdUserRole: newUser.role
        }
      });

      return newUser;

    } catch (error) {
      auditLogger.log({
        userId: currentUserId,
        action: 'create_user',
        resource: 'user',
        success: false,
        details: {
          email: sanitizeInput(email),
          role,
          error: sanitizeError(error)
        }
      });
      throw error;
    }
  }

  // Delete user with proper validation
  static async deleteUser(currentUserId: string, targetUserId: string): Promise<void> {
    try {
      // Validate current user permissions
      const canDelete = await this.validatePermission(currentUserId, 'users', 'delete');
      if (!canDelete) {
        throw new PermissionError('You do not have permission to delete users');
      }

      // Prevent self-deletion
      if (currentUserId === targetUserId) {
        throw new ValidationError('You cannot delete your own account');
      }

      // Get target user details
      const targetUserRole = await this.getUserRole(targetUserId);

      // Prevent deletion of admin by non-admin
      const currentUserRole = await this.getUserRole(currentUserId);
      if (targetUserRole === 'admin' && currentUserRole !== 'admin') {
        throw new PermissionError('Only administrators can delete admin users');
      }

      // Prevent deletion of the primary admin
      const targetUserDocs = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal('userId', targetUserId)]
      );

      if (targetUserDocs.documents.length > 0) {
        const targetUserDoc = targetUserDocs.documents[0];
        if (targetUserDoc.email === SECURITY_CONFIG.ADMIN_EMAIL) {
          throw new ValidationError('Cannot delete the primary administrator account');
        }

        // Delete from database first
        await databases.deleteDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          targetUserDoc.$id
        );
      }

      auditLogger.log({
        userId: currentUserId,
        action: 'delete_user',
        resource: 'user',
        success: true,
        details: {
          deletedUserId: targetUserId,
          deletedUserRole: targetUserRole
        }
      });

    } catch (error) {
      auditLogger.log({
        userId: currentUserId,
        action: 'delete_user',
        resource: 'user',
        success: false,
        details: {
          targetUserId,
          error: sanitizeError(error)
        }
      });
      throw error;
    }
  }

  // List users with proper filtering
  static async listUsers(currentUserId: string): Promise<User[]> {
    try {
      // Validate current user permissions
      const canRead = await this.validatePermission(currentUserId, 'users', 'read');
      if (!canRead) {
        throw new PermissionError('You do not have permission to view users');
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID
      );

      const users = response.documents.map(doc => ({
        id: doc.userId,
        email: doc.email,
        name: doc.name,
        role: doc.role as UserRole,
      }));

      auditLogger.log({
        userId: currentUserId,
        action: 'list_users',
        resource: 'user',
        success: true,
        details: { userCount: users.length }
      });

      return users;

    } catch (error) {
      auditLogger.log({
        userId: currentUserId,
        action: 'list_users',
        resource: 'user',
        success: false,
        details: { error: sanitizeError(error) }
      });
      throw error;
    }
  }
}

// Secure authentication service
export class SecureAuthService {

  // Enhanced login with role validation
  static async login(email: string, password: string): Promise<User> {
    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);

      // Create session
      await account.createEmailPasswordSession(sanitizedEmail, password);

      // Get account details
      const accountDetails = await account.get();

      // Get role from database (server-side validation)
      let userRole: UserRole;

      try {
        userRole = await SecureUserService.getUserRole(accountDetails.$id);
      } catch (error) {
        // If user not found in database but exists in auth, handle gracefully
        if (accountDetails.email === SECURITY_CONFIG.ADMIN_EMAIL) {
          userRole = 'admin';

          // Create admin user record in database if it doesn't exist
          try {
            await databases.createDocument(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              ID.unique(),
              {
                userId: accountDetails.$id,
                email: accountDetails.email,
                name: accountDetails.name,
                role: 'admin',
                createdAt: new Date().toISOString(),
              }
            );
          } catch (dbError) {
            console.warn('Could not create admin user record:', dbError);
          }
        } else {
          // For non-admin users, default to volunteer but log the issue
          userRole = 'volunteer';
          console.warn('User found in auth but not in database, defaulting to volunteer role');
        }
      }

      const user: User = {
        id: accountDetails.$id,
        email: accountDetails.email,
        name: accountDetails.name,
        role: userRole,
      };

      auditLogger.log({
        userId: user.id,
        action: 'login',
        resource: 'auth',
        success: true,
        details: { email: user.email, role: user.role }
      });

      return user;

    } catch (error) {
      auditLogger.log({
        userId: 'unknown',
        action: 'login',
        resource: 'auth',
        success: false,
        details: {
          email: sanitizeInput(email),
          error: sanitizeError(error)
        }
      });
      throw error;
    }
  }

  // Enhanced session check
  static async checkSession(): Promise<User | null> {
    try {
      const accountDetails = await account.get();

      // Get role from database
      const userRole = await SecureUserService.getUserRole(accountDetails.$id);

      const user: User = {
        id: accountDetails.$id,
        email: accountDetails.email,
        name: accountDetails.name,
        role: userRole,
      };

      return user;

    } catch (error) {
      // Session invalid or user not found
      return null;
    }
  }
}
