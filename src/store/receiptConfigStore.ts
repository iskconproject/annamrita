import { create } from 'zustand';
import { databases, DATABASE_ID, RECEIPT_CONFIG_COLLECTION_ID } from '../services/appwrite';
import { ReceiptConfig, DEFAULT_RECEIPT_CONFIG } from '../types/receipt';
import { ID, Query } from 'appwrite';

interface ReceiptConfigState {
  config: ReceiptConfig;
  isLoading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: ReceiptConfig) => Promise<void>;
}

export const useReceiptConfigStore = create<ReceiptConfigState>((set, get) => ({
  config: DEFAULT_RECEIPT_CONFIG,
  isLoading: false,
  error: null,

  fetchConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      try {
        // Try to get the receipt configuration from the database
        const response = await databases.listDocuments(
          DATABASE_ID,
          RECEIPT_CONFIG_COLLECTION_ID,
          [Query.limit(1)] // We only need one configuration
        );

        if (response.documents.length > 0) {
          const doc = response.documents[0];
          const config: ReceiptConfig = {
            id: doc.$id,
            headerText: doc.headerText,
            footerText: doc.footerText,
            showLogo: doc.showLogo,
            showQRCode: doc.showQRCode,
            qrCodeData: doc.qrCodeData,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt),
          };
          set({ config, isLoading: false });
        } else {
          // No configuration found, use default and create one
          await get().updateConfig(DEFAULT_RECEIPT_CONFIG);
          set({ isLoading: false });
        }
      } catch (dbError) {
        // Handle database not found or collection not found errors gracefully
        console.warn('Database or collection not found, using default receipt config:', dbError);
        set({ config: DEFAULT_RECEIPT_CONFIG, isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching receipt configuration:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch receipt configuration',
        isLoading: false,
      });
    }
  },

  updateConfig: async (config: ReceiptConfig) => {
    set({ isLoading: true, error: null });
    try {
      const { id, ...configData } = config;
      
      // Add timestamps
      const now = new Date();
      const dataToSave = {
        ...configData,
        updatedAt: now,
      };

      let savedConfig;

      if (id) {
        // Update existing configuration
        const response = await databases.updateDocument(
          DATABASE_ID,
          RECEIPT_CONFIG_COLLECTION_ID,
          id,
          dataToSave
        );

        savedConfig = {
          id: response.$id,
          ...dataToSave,
          createdAt: new Date(response.createdAt),
          updatedAt: new Date(response.updatedAt),
        };
      } else {
        // Create new configuration
        dataToSave.createdAt = now;
        
        const response = await databases.createDocument(
          DATABASE_ID,
          RECEIPT_CONFIG_COLLECTION_ID,
          ID.unique(),
          dataToSave
        );

        savedConfig = {
          id: response.$id,
          ...dataToSave,
          createdAt: new Date(response.createdAt),
          updatedAt: new Date(response.updatedAt),
        };
      }

      set({ config: savedConfig as ReceiptConfig, isLoading: false });
    } catch (error) {
      console.error('Error updating receipt configuration:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update receipt configuration',
        isLoading: false,
      });
    }
  },
}));
