import { create } from 'zustand';
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID } from '../services/appwrite';
import { User, UserRole } from '../types/auth';
import { ID, Query } from 'appwrite';

interface AuthState {
  user: User | null;
  users: User[];
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  addUser: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  fetchUsers: () => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

// Admin user credentials
const ADMIN_EMAIL = 'arindamdawn3@gmail.com';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  users: [],
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Check if there's an active session and delete it first
      try {
        // Try to get the current session
        await account.getSession('current');
        // If successful, delete it
        await account.deleteSession('current');
      } catch (sessionError) {
        // No active session or error getting session, we can proceed
        console.log('No active session found or error getting session');
      }

      // Now create a new session
      console.log('Creating email password session...');
      await account.createEmailPasswordSession(email, password);
      console.log('Session created successfully');

      console.log('Getting account details...');
      const accountDetails = await account.get();
      console.log('Account details:', accountDetails);

      // Determine if this is the admin user
      const isAdmin = accountDetails.email === ADMIN_EMAIL;

      // Try to fetch user role from database
      let userRole: UserRole = isAdmin ? 'admin' : 'volunteer';

      try {
        const userDocs = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.equal('email', accountDetails.email)]
        );

        if (userDocs.documents.length > 0) {
          userRole = userDocs.documents[0].role as UserRole;
        } else if (isAdmin) {
          // If admin user doesn't exist in the database yet, create it
          await databases.createDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            ID.unique(),
            {
              userId: accountDetails.$id,
              email: accountDetails.email,
              name: accountDetails.name,
              role: 'admin'
            }
          );
        }
      } catch (dbError) {
        console.warn('Error fetching user role from database:', dbError);
        // If database error, default to admin for the admin email, volunteer for others
      }

      const user: User = {
        id: accountDetails.$id,
        email: accountDetails.email,
        name: accountDetails.name,
        role: userRole,
      };

      console.log('Setting user in store:', user);
      set({ user, isLoading: false });
      console.log('Login completed successfully');
    } catch (error) {
      console.error('Login error:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to login',
        isLoading: false
      });
    }
  },

  addUser: async (email: string, password: string, name: string, role: UserRole) => {
    set({ isLoading: true, error: null });
    try {
      // Create the user in Appwrite auth
      const response = await account.create(
        ID.unique(),
        email,
        password,
        name
      );

      // Store user details with role in the database
      await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        ID.unique(),
        {
          userId: response.$id,
          email: response.email,
          name: response.name,
          role: role
        }
      );

      // Fetch updated users list
      await get().fetchUsers();

      set({ isLoading: false });
    } catch (error) {
      console.error('Add user error:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to add user',
        isLoading: false
      });
    }
  },

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
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

      set({ users, isLoading: false });
    } catch (error) {
      console.error('Fetch users error:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        isLoading: false
      });
    }
  },

  deleteUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Find the user document by userId
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      if (response.documents.length > 0) {
        // Delete the user document
        await databases.deleteDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          response.documents[0].$id
        );
      }

      // Update the users list
      const users = get().users.filter(user => user.id !== userId);
      set({ users, isLoading: false });
    } catch (error) {
      console.error('Delete user error:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete user',
        isLoading: false
      });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await account.deleteSession('current');
      // Only clear the redirect path on explicit logout
      localStorage.removeItem('redirectPath');
      set({ user: null, isLoading: false });
    } catch (error) {
      console.error('Logout error:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to logout',
        isLoading: false
      });
    }
  },

  checkSession: async () => {
    console.log('Checking session...');
    set({ isLoading: true, error: null });
    try {
      // First check if we have a current session
      try {
        await account.getSession('current');
      } catch (sessionError) {
        console.log('No active session found:', sessionError);
        set({ user: null, isLoading: false });
        return; // Exit early if no session exists
      }

      // If we have a session, get the account details
      console.log('Getting account details...');
      const accountDetails = await account.get();
      console.log('Account details retrieved:', accountDetails);

      // Determine if this is the admin user
      const isAdmin = accountDetails.email === ADMIN_EMAIL;

      // Try to fetch user role from database
      let userRole: UserRole = isAdmin ? 'admin' : 'volunteer';

      try {
        const userDocs = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.equal('email', accountDetails.email)]
        );

        if (userDocs.documents.length > 0) {
          userRole = userDocs.documents[0].role as UserRole;
        } else if (isAdmin) {
          // If admin user doesn't exist in the database yet, create it
          await databases.createDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            ID.unique(),
            {
              userId: accountDetails.$id,
              email: accountDetails.email,
              name: accountDetails.name,
              role: 'admin'
            }
          );
        }
      } catch (dbError) {
        console.warn('Error fetching user role from database:', dbError);
        // If database error, default to admin for the admin email, volunteer for others
      }

      const user: User = {
        id: accountDetails.$id,
        email: accountDetails.email,
        name: accountDetails.name,
        role: userRole,
      };

      console.log('Setting user in store:', user);
      set({ user, isLoading: false });
      console.log('Session check completed successfully');
    } catch (error) {
      // Something went wrong with the session check
      console.error('Error checking session:', error);
      set({ user: null, isLoading: false, error: 'Failed to check session' });
    }
  },
}));
