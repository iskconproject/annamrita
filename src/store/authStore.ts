import { create } from 'zustand';
import { account } from '../services/appwrite';
import { User, UserRole } from '../types/auth';
import {
  SecureUserService,
  SecureAuthService,
  SecurityError,
  PermissionError,
  ValidationError
} from '../services/secureApi';
import {
  rateLimiter,
  sanitizeError,
  auditLogger
} from '../utils/security';

interface AuthState {
  user: User | null;
  users: User[];
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  addUser: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  fetchUsers: () => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  users: [],
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      // Check rate limiting
      if (rateLimiter.isRateLimited(email)) {
        throw new SecurityError('Too many login attempts. Please try again later.');
      }

      // Check if there's an active session and delete it first
      try {
        await account.getSession('current');
        await account.deleteSession('current');
      } catch (sessionError) {
        // No active session, proceed
        console.log('No active session found');
      }

      // Use secure authentication service
      const user = await SecureAuthService.login(email, password);

      // Reset rate limiter on successful login
      rateLimiter.reset(email);

      console.log('Setting user in store:', user);
      set({ user, isLoading: false });
      console.log('Login completed successfully');

    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = 'Failed to login';

      if (error instanceof SecurityError || error instanceof PermissionError || error instanceof ValidationError) {
        errorMessage = error.message;
      } else {
        errorMessage = sanitizeError(error);
      }

      set({
        error: errorMessage,
        isLoading: false
      });
    }
  },

  register: async (_email: string, _password: string, _name: string, _role: UserRole) => {
    // Registration is disabled for security reasons
    // All user creation should go through the secure addUser method
    throw new SecurityError('Direct registration is disabled. Please contact an administrator to create your account.');
  },

  addUser: async (email: string, password: string, name: string, role: UserRole) => {
    set({ isLoading: true, error: null });
    try {
      const currentUser = get().user;
      if (!currentUser) {
        throw new SecurityError('You must be logged in to add users');
      }

      // Use secure user service
      const newUser = await SecureUserService.createUser(
        currentUser.id,
        email,
        password,
        name,
        role
      );

      // Update users list
      const users = [...get().users, newUser];
      set({ users, isLoading: false });

    } catch (error) {
      console.error('Add user error:', error);

      let errorMessage = 'Failed to add user';

      if (error instanceof SecurityError || error instanceof PermissionError || error instanceof ValidationError) {
        errorMessage = error.message;
      } else {
        errorMessage = sanitizeError(error);
      }

      set({
        error: errorMessage,
        isLoading: false
      });
    }
  },

  fetchUsers: async () => {
    // If already loading or we already have users, don't fetch again
    if (get().isLoading || get().users.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const currentUser = get().user;
      if (!currentUser) {
        throw new SecurityError('You must be logged in to fetch users');
      }

      // Use secure user service
      const users = await SecureUserService.listUsers(currentUser.id);
      set({ users, isLoading: false });

    } catch (error) {
      console.error('Fetch users error:', error);

      let errorMessage = 'Failed to fetch users';

      if (error instanceof SecurityError || error instanceof PermissionError || error instanceof ValidationError) {
        errorMessage = error.message;
        set({
          error: errorMessage,
          isLoading: false
        });
      } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // Network error - use offline fallback
        const offlineUsers: User[] = [
          { id: 'offline-admin', name: 'Admin User (Offline)', email: 'admin@example.com', role: 'admin' },
          { id: 'offline-volunteer', name: 'Volunteer User (Offline)', email: 'volunteer@example.com', role: 'volunteer' },
        ];

        set({
          users: offlineUsers,
          error: 'Network error: Unable to connect to the server',
          isLoading: false
        });
      } else {
        set({
          error: sanitizeError(error),
          isLoading: false
        });
      }
    }
  },

  deleteUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const currentUser = get().user;
      if (!currentUser) {
        throw new SecurityError('You must be logged in to delete users');
      }

      // Use secure user service
      await SecureUserService.deleteUser(currentUser.id, userId);

      // Update the users list
      const users = get().users.filter(user => user.id !== userId);
      set({ users, isLoading: false });

    } catch (error) {
      console.error('Delete user error:', error);

      let errorMessage = 'Failed to delete user';

      if (error instanceof SecurityError || error instanceof PermissionError || error instanceof ValidationError) {
        errorMessage = error.message;
      } else {
        errorMessage = sanitizeError(error);
      }

      set({
        error: errorMessage,
        isLoading: false
      });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    const currentUser = get().user;

    try {
      await account.deleteSession('current');

      // Audit log the logout
      if (currentUser) {
        auditLogger.log({
          userId: currentUser.id,
          action: 'logout',
          resource: 'auth',
          success: true,
          details: { email: currentUser.email }
        });
      }

      // Only clear the redirect path on explicit logout
      localStorage.removeItem('redirectPath');
      set({ user: null, isLoading: false });
    } catch (error) {
      console.error('Logout error:', error);

      // Audit log the failed logout
      if (currentUser) {
        auditLogger.log({
          userId: currentUser.id,
          action: 'logout',
          resource: 'auth',
          success: false,
          details: { error: sanitizeError(error) }
        });
      }

      set({
        error: sanitizeError(error),
        isLoading: false
      });
    }
  },

  checkSession: async () => {
    // If already loading, don't make another request
    if (get().isLoading) return;

    console.log('Checking session...');
    set({ isLoading: true, error: null });
    try {
      // Use secure authentication service
      const user = await SecureAuthService.checkSession();

      if (user) {
        console.log('Setting user in store:', user);
        set({ user, isLoading: false });
        console.log('Session check completed successfully');
      } else {
        console.log('No valid session found');
        set({ user: null, isLoading: false });
      }
    } catch (error) {
      // Something went wrong with the session check
      console.error('Error checking session:', error);
      set({ user: null, isLoading: false, error: sanitizeError(error) });
    }
  },
}));
