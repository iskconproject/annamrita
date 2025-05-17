import { Account, Client, Databases, Storage } from 'appwrite';

// Initialize Appwrite client
export const client = new Client();

// Set Appwrite endpoint and project ID from environment variables
// Add fallback values to prevent errors when environment variables are not set
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

client
  .setEndpoint(endpoint)
  .setProject(projectId);

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and collection IDs from environment variables with fallback values
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'default-database';
export const MENU_ITEMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MENU_ITEMS_COLLECTION_ID || 'menu-items';
export const ORDERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID || 'orders';
export const USERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users';
export const RECEIPT_CONFIG_COLLECTION_ID = import.meta.env.VITE_APPWRITE_RECEIPT_CONFIG_COLLECTION_ID || 'receipt-config';
export const CATEGORIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CATEGORIES_COLLECTION_ID || 'categories';

// Storage bucket ID from environment variables
export const STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'default-bucket';
