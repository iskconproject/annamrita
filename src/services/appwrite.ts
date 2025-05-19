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
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '6804a8c2000b9c7f4716';
export const MENU_ITEMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MENU_ITEMS_COLLECTION_ID || '6805edaf0006de1435cd';
export const ORDERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID || '6805ede2001c256497f2';
export const USERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || '6805edf1002dd84d087c';
export const RECEIPT_CONFIG_COLLECTION_ID = import.meta.env.VITE_APPWRITE_RECEIPT_CONFIG_COLLECTION_ID || '6807354d00302547ab6a';
export const CATEGORIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CATEGORIES_COLLECTION_ID || '6807495c001bdc0294b4';

// Storage bucket ID from environment variables
export const STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'default-bucket';
