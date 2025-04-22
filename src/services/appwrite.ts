import { Account, Client, Databases, Storage } from 'appwrite';

// Initialize Appwrite client
export const client = new Client();

// Set Appwrite endpoint and project ID
// These values should be replaced with actual values when deploying
client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6804a6bb003b71dee582'); // Replace with your Appwrite project ID

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Database and collection IDs
export const DATABASE_ID = '6804a8c2000b9c7f4716'; // ID of the annamrita-db database
export const MENU_ITEMS_COLLECTION_ID = '6805edaf0006de1435cd'; // menu-items collection
export const ORDERS_COLLECTION_ID = '6805ede2001c256497f2'; // orders collection
export const USERS_COLLECTION_ID = '6805edf1002dd84d087c'; // users collection
export const RECEIPT_CONFIG_COLLECTION_ID = '6807354d00302547ab6a'; // receipt-config collection

// Storage bucket ID
export const STORAGE_BUCKET_ID = 'annamrita-storage';
