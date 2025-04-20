import { create } from 'zustand';
import { account } from '../services/appwrite';
import { User, UserRole } from '../types/auth';
import { ID, Models } from 'appwrite';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await account.createEmailSession(email, password);
      const accountDetails = await account.get();
      
      // In a real app, you would fetch the user's role from your database
      // For now, we'll assume a default role
      const user: User = {
        id: accountDetails.$id,
        email: accountDetails.email,
        name: accountDetails.name,
        role: 'volunteer', // Default role, should be fetched from database
      };
      
      set({ user, isLoading: false });
    } catch (error) {
      console.error('Login error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to login', 
        isLoading: false 
      });
    }
  },

  register: async (email: string, password: string, name: string, role: UserRole) => {
    set({ isLoading: true, error: null });
    try {
      const response = await account.create(
        ID.unique(),
        email,
        password,
        name
      );
      
      // In a real app, you would store the user's role in your database
      await account.createEmailSession(email, password);
      
      const user: User = {
        id: response.$id,
        email: response.email,
        name: response.name,
        role: role,
      };
      
      set({ user, isLoading: false });
    } catch (error) {
      console.error('Registration error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to register', 
        isLoading: false 
      });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await account.deleteSession('current');
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
    set({ isLoading: true, error: null });
    try {
      const accountDetails = await account.get();
      
      // In a real app, you would fetch the user's role from your database
      const user: User = {
        id: accountDetails.$id,
        email: accountDetails.email,
        name: accountDetails.name,
        role: 'volunteer', // Default role, should be fetched from database
      };
      
      set({ user, isLoading: false });
    } catch (error) {
      // User is not logged in
      set({ user: null, isLoading: false });
    }
  },
}));
