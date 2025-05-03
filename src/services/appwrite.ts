import { Account, Client, Databases, Storage } from 'appwrite';

// Initialize Appwrite client
export const client = new Client();

// Set Appwrite endpoint and project ID from environment variables
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and collection IDs from environment variables
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const MENU_ITEMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MENU_ITEMS_COLLECTION_ID;
export const ORDERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID;
export const USERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
export const RECEIPT_CONFIG_COLLECTION_ID = import.meta.env.VITE_APPWRITE_RECEIPT_CONFIG_COLLECTION_ID;
export const CATEGORIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CATEGORIES_COLLECTION_ID;

// Storage bucket ID from environment variables
export const STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID;
