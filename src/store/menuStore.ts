import { create } from 'zustand';
import { databases, DATABASE_ID, MENU_ITEMS_COLLECTION_ID, CATEGORIES_COLLECTION_ID } from '../services/appwrite';
import { MenuItem } from '../types/menu';
import { Category } from '../types/category';
import { ID } from 'appwrite';

interface MenuState {
  items: MenuItem[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchMenuItems: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  addCategory: (name: string) => Promise<Category | null>;
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
    // If already loading, don't make another request
    if (get().isLoading) return;

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

        // Don't fetch categories here - we'll do it separately to avoid duplicate requests

        set({ items, isLoading: false });
      } catch (dbError) {
        // Check if it's a network error
        if (dbError instanceof TypeError && dbError.message.includes('Failed to fetch')) {
          console.error('Network error when fetching menu items:', dbError);
          throw dbError; // Re-throw to be caught by the outer catch
        }

        // Handle database not found or collection not found errors gracefully
        console.warn('Database or collection not found, using sample menu items:', dbError);

        // Set default sample menu items for development
        const sampleItems: MenuItem[] = [
          { id: 'sample-1', name: 'Vegetable Pulao', shortName: 'Veg Pulao', category: 'Main Course', price: 120, available: true },
          { id: 'sample-2', name: 'Paneer Butter Masala', shortName: 'PBM', category: 'Main Course', price: 150, available: true },
          { id: 'sample-3', name: 'Gulab Jamun', shortName: 'GJ', category: 'Dessert', price: 30, available: true },
          { id: 'sample-4', name: 'Lassi', shortName: 'Lassi', category: 'Beverage', price: 40, available: true },
        ];

        // Set sample categories if needed
        const sampleCategories: Category[] = [
          { id: 'sample-cat-1', name: 'Main Course' },
          { id: 'sample-cat-2', name: 'Dessert' },
          { id: 'sample-cat-3', name: 'Beverage' },
          { id: 'sample-cat-4', name: 'Snacks' },
        ];

        set({ items: sampleItems, categories: sampleCategories, isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);

      // Use sample data for network errors too
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        const sampleItems: MenuItem[] = [
          { id: 'offline-1', name: 'Vegetable Pulao', shortName: 'Veg Pulao', category: 'Main Course', price: 120, available: true },
          { id: 'offline-2', name: 'Paneer Butter Masala', shortName: 'PBM', category: 'Main Course', price: 150, available: true },
          { id: 'offline-3', name: 'Gulab Jamun', shortName: 'GJ', category: 'Dessert', price: 30, available: true },
          { id: 'offline-4', name: 'Lassi', shortName: 'Lassi', category: 'Beverage', price: 40, available: true },
        ];

        set({
          items: sampleItems,
          error: 'Network error: Unable to connect to the server',
          isLoading: false
        });
      } else {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch menu items',
          isLoading: false
        });
      }
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

        // Check if we need to add a new category
        const categoryExists = get().categories.some(cat => cat.name === newItem.category);
        if (!categoryExists) {
          await get().addCategory(newItem.category);
        }

        set({ items, isLoading: false });
      } catch (dbError) {
        // Handle database not found or collection not found errors gracefully
        console.warn('Database or collection not found, adding item locally only:', dbError);

        // Create a local item with a temporary ID
        const newItem: MenuItem = {
          id: 'local-' + Date.now(),
          ...item,
        };

        const items = [...get().items, newItem];

        // Check if we need to add a new category
        const categoryExists = get().categories.some(cat => cat.name === newItem.category);
        if (!categoryExists) {
          await get().addCategory(newItem.category);
        }

        set({ items, isLoading: false });
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

      set({ items, isLoading: false });
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
      set({ items, isLoading: false });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete menu item',
        isLoading: false
      });
    }
  },

  fetchCategories: async () => {
    // If we already have categories, don't fetch again unless forced
    if (get().categories.length > 0 && !get().categories[0].id.startsWith('sample-') &&
      !get().categories[0].id.startsWith('fallback-') && !get().categories[0].id.startsWith('local-')) {
      return;
    }

    try {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          CATEGORIES_COLLECTION_ID
        );

        const categories = response.documents.map((doc) => ({
          id: doc.$id,
          name: doc.name,
        })) as Category[];

        set({ categories });
      } catch (dbError) {
        // Check if it's a network error
        if (dbError instanceof TypeError && dbError.message.includes('Failed to fetch')) {
          console.error('Network error when fetching categories:', dbError);
          throw dbError; // Re-throw to be caught by the outer catch
        }

        // Handle database not found or collection not found errors gracefully
        console.warn('Categories collection not found or access denied:', dbError);

        // Use sample categories instead of trying to create the collection
        // This avoids authentication errors when the user doesn't have permission
        const sampleCategories: Category[] = [
          { id: 'sample-cat-1', name: 'Main Course' },
          { id: 'sample-cat-2', name: 'Dessert' },
          { id: 'sample-cat-3', name: 'Beverage' },
          { id: 'sample-cat-4', name: 'Snacks' },
        ];

        set({ categories: sampleCategories });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Ensure we always have some categories even if there's an error
      const fallbackCategories: Category[] = [
        { id: 'offline-cat-1', name: 'Main Course' },
        { id: 'offline-cat-2', name: 'Dessert' },
        { id: 'offline-cat-3', name: 'Beverage' },
        { id: 'offline-cat-4', name: 'Snacks' },
      ];
      set({ categories: fallbackCategories });
    }
  },

  addCategory: async (name) => {
    try {
      // Check if category already exists
      const existingCategory = get().categories.find(cat => cat.name === name);
      if (existingCategory) {
        return existingCategory;
      }

      try {
        // Create new category
        const response = await databases.createDocument(
          DATABASE_ID,
          CATEGORIES_COLLECTION_ID,
          ID.unique(),
          { name }
        );

        const newCategory: Category = {
          id: response.$id,
          name: response.name,
        };

        set({ categories: [...get().categories, newCategory] });
        return newCategory;
      } catch (dbError) {
        console.warn('Unable to create category in database:', dbError);

        // Create a local category if database operation fails
        const localCategory: Category = {
          id: 'local-cat-' + Date.now(),
          name,
        };

        set({ categories: [...get().categories, localCategory] });
        return localCategory;
      }
    } catch (error) {
      console.error('Error adding category:', error);

      // If we can't add to the database, create a local one with a temporary ID
      const tempCategory: Category = {
        id: 'local-cat-' + Date.now(),
        name,
      };

      set({ categories: [...get().categories, tempCategory] });
      return tempCategory;
    }
  },
}));
