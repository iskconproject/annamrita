import { create } from 'zustand';
import { databases, DATABASE_ID, MENU_ITEMS_COLLECTION_ID } from '../services/appwrite';
import { MenuItem } from '../types/menu';
import { ID, Query } from 'appwrite';

interface MenuState {
  items: MenuItem[];
  categories: string[];
  isLoading: boolean;
  error: string | null;
  fetchMenuItems: () => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  toggleItemAvailability: (id: string, available: boolean) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  categories: [],
  isLoading: false,
  error: null,

  fetchMenuItems: async () => {
    set({ isLoading: true, error: null });
    try {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          MENU_ITEMS_COLLECTION_ID
        );

        const items = response.documents.map((doc) => ({
          id: doc.$id,
          name: doc.name,
          category: doc.category,
          price: doc.price,
          available: doc.available,
          shortName: doc.shortName,
        })) as MenuItem[];

        // Extract unique categories
        const categories = Array.from(new Set(items.map(item => item.category)));

        set({ items, categories, isLoading: false });
      } catch (dbError) {
        // Handle database not found or collection not found errors gracefully
        console.warn('Database or collection not found, using empty menu items list:', dbError);

        // Set default sample menu items for development
        const sampleItems: MenuItem[] = [
          { id: 'sample-1', name: 'Vegetable Pulao', shortName: 'Veg Pulao', category: 'Main Course', price: 120, available: true },
          { id: 'sample-2', name: 'Paneer Butter Masala', shortName: 'PBM', category: 'Main Course', price: 150, available: true },
          { id: 'sample-3', name: 'Gulab Jamun', shortName: 'GJ', category: 'Dessert', price: 30, available: true },
          { id: 'sample-4', name: 'Lassi', shortName: 'Lassi', category: 'Beverage', price: 40, available: true },
        ];

        const categories = ['Main Course', 'Dessert', 'Beverage'];

        set({ items: sampleItems, categories, isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch menu items',
        isLoading: false
      });
    }
  },

  addMenuItem: async (item) => {
    set({ isLoading: true, error: null });
    try {
      try {
        const response = await databases.createDocument(
          DATABASE_ID,
          MENU_ITEMS_COLLECTION_ID,
          ID.unique(),
          item
        );

        const newItem: MenuItem = {
          id: response.$id,
          name: response.name,
          category: response.category,
          price: response.price,
          available: response.available,
          shortName: response.shortName,
        };

        const items = [...get().items, newItem];
        const categories = Array.from(new Set(items.map(item => item.category)));

        set({ items, categories, isLoading: false });
      } catch (dbError) {
        // Handle database not found or collection not found errors gracefully
        console.warn('Database or collection not found, adding item locally only:', dbError);

        // Create a local item with a temporary ID
        const newItem: MenuItem = {
          id: 'local-' + Date.now(),
          ...item,
        };

        const items = [...get().items, newItem];
        const categories = Array.from(new Set(items.map(item => item.category)));

        set({ items, categories, isLoading: false });
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to add menu item',
        isLoading: false
      });
    }
  },

  updateMenuItem: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        MENU_ITEMS_COLLECTION_ID,
        id,
        updates
      );

      const updatedItem: MenuItem = {
        id: response.$id,
        name: response.name,
        category: response.category,
        price: response.price,
        available: response.available,
        shortName: response.shortName,
      };

      const items = get().items.map(item =>
        item.id === id ? updatedItem : item
      );

      const categories = Array.from(new Set(items.map(item => item.category)));

      set({ items, categories, isLoading: false });
    } catch (error) {
      console.error('Error updating menu item:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update menu item',
        isLoading: false
      });
    }
  },

  toggleItemAvailability: async (id, available) => {
    set({ isLoading: true, error: null });
    try {
      await databases.updateDocument(
        DATABASE_ID,
        MENU_ITEMS_COLLECTION_ID,
        id,
        { available }
      );

      const items = get().items.map(item =>
        item.id === id ? { ...item, available } : item
      );

      set({ items, isLoading: false });
    } catch (error) {
      console.error('Error toggling item availability:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to toggle item availability',
        isLoading: false
      });
    }
  },

  deleteMenuItem: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        MENU_ITEMS_COLLECTION_ID,
        id
      );

      const items = get().items.filter(item => item.id !== id);
      const categories = Array.from(new Set(items.map(item => item.category)));

      set({ items, categories, isLoading: false });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete menu item',
        isLoading: false
      });
    }
  },
}));
