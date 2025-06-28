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

  // Get user role from database (server-side validation) with fallbacks
  static async getUserRole(userId: string): Promise<UserRole> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      if (response.documents.length === 0) {
        // Fallback: Check current user account for role information
        console.log(`User ${userId} not found in database, checking fallback...`);
        
        try {
          const currentAccount = await account.get();
          if (currentAccount.$id === userId) {
            // Check user preferences for role
            const prefs = currentAccount.prefs || {};
            if (prefs.role && isValidRole(prefs.role)) {
              console.log(`Using role from preferences: ${prefs.role}`);
              return prefs.role as UserRole;
            }
            
            // Check user labels for role
            const labels = currentAccount.labels || [];
            if (labels.includes('admin')) {
              console.log('Using admin role from labels');
              return 'admin';
            }
            
            // Check if known admin by email
            if (currentAccount.email === 'arindamdawn3@gmail.com' || 
                currentAccount.email === 'iskconasansol@gmail.com') {
              console.log(`Recognized admin user: ${currentAccount.email}`);
              return 'admin';
            }
          }
        } catch (fallbackError) {
          console.warn('Fallback role check failed:', fallbackError);
        }
        
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

  // Validate user permissions for an action with enhanced fallback
  static async validatePermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      let userRole: UserRole;
      
      try {
        userRole = await this.getUserRole(userId);
      } catch (error) {
        // Additional fallback: Check account directly if getUserRole fails
        try {
          const currentAccount = await account.get();
          if (currentAccount.$id === userId) {
            const prefs = currentAccount.prefs || {};
            const labels = currentAccount.labels || [];
            
            if (prefs.role === 'admin' || labels.includes('admin') ||
                currentAccount.email === 'arindamdawn3@gmail.com' ||
                currentAccount.email === 'iskconasansol@gmail.com') {
              userRole = 'admin';
              console.log(`Using admin role from direct account check for permission validation`);
            } else {
              throw error; // Re-throw original error
            }
          } else {
            throw error;
          }
        } catch (fallbackError) {
          throw error; // Re-throw original error
        }
      }
      
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

  // List users with proper filtering and fallback support
  static async listUsers(currentUserId: string): Promise<User[]> {
    try {
      // Validate current user permissions with enhanced fallback
      let canRead = false;
      try {
        canRead = await this.validatePermission(currentUserId, 'users', 'read');
      } catch (error) {
        // Direct fallback check for migrated admin users
        try {
          const currentAccount = await account.get();
          if (currentAccount.$id === currentUserId) {
            const prefs = currentAccount.prefs || {};
            const labels = currentAccount.labels || [];
            
            if (prefs.role === 'admin' || labels.includes('admin') ||
                currentAccount.email === 'arindamdawn3@gmail.com' ||
                currentAccount.email === 'iskconasansol@gmail.com') {
              canRead = true;
              console.log(`Allowing admin access via direct fallback for user ${currentUserId}`);
            }
          }
        } catch (fallbackError) {
          console.warn('Direct permission fallback failed:', fallbackError);
        }
      }
      
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

  // Enhanced login with role validation and fallbacks
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
        // Enhanced fallback for migrated users
        console.log('getUserRole failed during login, checking fallback options...');
        
        // Check user preferences first
        const prefs = accountDetails.prefs || {};
        if (prefs.role && isValidRole(prefs.role)) {
          userRole = prefs.role as UserRole;
          console.log(`Using role from preferences: ${userRole}`);
        }
        // Check user labels
        else if (accountDetails.labels && accountDetails.labels.includes('admin')) {
          userRole = 'admin';
          console.log('Using admin role from labels');
        }
        // Check known admin emails
        else if (accountDetails.email === SECURITY_CONFIG.ADMIN_EMAIL || 
                 accountDetails.email === 'iskconasansol@gmail.com') {
          userRole = 'admin';
          console.log(`Recognized admin user: ${accountDetails.email}`);
        } else {
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

  // Enhanced session check with fallbacks
  static async checkSession(): Promise<User | null> {
    try {
      const accountDetails = await account.get();

      // Get role from database with fallback
      let userRole: UserRole;
      try {
        userRole = await SecureUserService.getUserRole(accountDetails.$id);
      } catch (error) {
        // Use same fallback logic as login
        const prefs = accountDetails.prefs || {};
        if (prefs.role && isValidRole(prefs.role)) {
          userRole = prefs.role as UserRole;
          console.log(`Session check: Using role from preferences: ${userRole}`);
        } else if (accountDetails.labels && accountDetails.labels.includes('admin')) {
          userRole = 'admin';
          console.log('Session check: Using admin role from labels');
        } else if (accountDetails.email === SECURITY_CONFIG.ADMIN_EMAIL || 
                   accountDetails.email === 'iskconasansol@gmail.com') {
          userRole = 'admin';
          console.log(`Session check: Recognized admin user: ${accountDetails.email}`);
        } else {
          userRole = 'volunteer';
          console.log('Session check: Defaulting to volunteer role');
        }
      }

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