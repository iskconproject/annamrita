import { Account, Client, Databases, Storage } from 'appwrite';

// Initialize Appwrite client
export const client = new Client();

// Set Appwrite endpoint and project ID
// These values should be replaced with actual values when deploying
client
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6804a6bb003b71dee582'); // Replace with your Appwrite project ID

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and collection IDs
export const DATABASE_ID = 'annamrita-db';
export const MENU_ITEMS_COLLECTION_ID = 'menu-items';
export const ORDERS_COLLECTION_ID = 'orders';
export const USERS_COLLECTION_ID = 'users';

// Storage bucket ID
export const STORAGE_BUCKET_ID = 'annamrita-storage';
