import { create } from 'zustand';
import { databases, DATABASE_ID, ORDERS_COLLECTION_ID } from '../services/appwrite';
import { Order, OrderItem, OrderStatus } from '../types/order';
import { ID, Query, AppwriteException } from 'appwrite';

interface OrderState {
  currentOrder: OrderItem[];
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  addItemToOrder: (item: OrderItem) => void;
  removeItemFromOrder: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCurrentOrder: () => void;
  calculateTotal: () => number;
  createOrder: (phoneNumber?: string) => Promise<Order | null>;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  currentOrder: [],
  orders: [],
  isLoading: false,
  error: null,

  addItemToOrder: (item) => {
    const currentOrder = [...get().currentOrder];
    const existingItemIndex = currentOrder.findIndex(i => i.itemId === item.itemId);

    if (existingItemIndex !== -1) {
      // Item already exists, update quantity
      currentOrder[existingItemIndex].quantity += item.quantity;
    } else {
      // Add new item
      currentOrder.push(item);
    }

    set({ currentOrder });
  },

  removeItemFromOrder: (itemId) => {
    const currentOrder = get().currentOrder.filter(item => item.itemId !== itemId);
    set({ currentOrder });
  },

  updateItemQuantity: (itemId, quantity) => {
    const currentOrder = get().currentOrder.map(item =>
      item.itemId === itemId ? { ...item, quantity } : item
    );
    set({ currentOrder });
  },

  clearCurrentOrder: () => {
    set({ currentOrder: [] });
  },

  calculateTotal: () => {
    return get().currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  createOrder: async (phoneNumber) => {
    const { currentOrder } = get();

    if (currentOrder.length === 0) {
      set({ error: 'Cannot create an empty order' });
      return null;
    }

    set({ isLoading: true, error: null });

    try {
      const total = get().calculateTotal();

      // Format the date as ISO string for Appwrite compatibility
      const now = new Date();

      // Generate order number based on date and count
      // Format: DDMMYYYYNN where NN is the order number for the day
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear().toString();

      // Get the count of orders for today to determine the order number
      let orderCount = 1; // Default to 1 if we can't determine the count

      try {
        // Try to count orders from today to determine the order number
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const todayOrders = get().orders.filter(order =>
          order.createdAt >= startOfDay && order.createdAt <= now
        );

        // Set the order count to the number of orders today + 1
        orderCount = todayOrders.length + 1;
      } catch (error) {
        console.warn('Could not determine order count for today, using default', error);
      }

      // Format the order number with padded zeros (e.g., 01, 02, etc.)
      const orderNumberForDay = orderCount.toString().padStart(2, '0');
      const formattedOrderNumber = `${day}${month}${year}${orderNumberForDay}`;

      // Serialize the items array to JSON string for Appwrite storage
      const orderData = {
        items: JSON.stringify(currentOrder), // Convert array to JSON string for storage
        status: 'Pending' as OrderStatus,
        total,
        phoneNumber,
        createdAt: now.toISOString(), // Use ISO string format for Appwrite
        // In a real app, this would be the current user's ID
        createdBy: 'current-user-id',
        // Add orderNumber field with the new format
        orderNumber: formattedOrderNumber,
      };

      // Log the order data being sent to Appwrite
      console.log('Creating order with data:', orderData);
      console.log('Using DATABASE_ID:', DATABASE_ID);
      console.log('Using ORDERS_COLLECTION_ID:', ORDERS_COLLECTION_ID);

      try {
        const response = await databases.createDocument(
          DATABASE_ID,
          ORDERS_COLLECTION_ID,
          ID.unique(),
          orderData
        );

        console.log('Order created successfully in Appwrite:', response);

        // Parse the items JSON string back to an array
        const newOrder: Order = {
          id: response.$id,
          items: JSON.parse(response.items), // Parse the JSON string back to an array
          status: response.status,
          total: response.total,
          phoneNumber: response.phoneNumber,
          createdBy: response.createdBy,
          createdAt: new Date(response.createdAt),
          orderNumber: response.orderNumber,
        };

        const orders = [...get().orders, newOrder];

        set({ orders, isLoading: false, error: null });
        // Don't clear the current order here - let the UI component handle this
        // based on whether the entire operation (including printing) was successful

        return newOrder;
      } catch (dbError: unknown) {
        // Log detailed error information
        const appwriteError = dbError as AppwriteException;
        console.error('Appwrite database error details:', {
          message: appwriteError.message,
          code: appwriteError.code,
          type: appwriteError.type,
          response: appwriteError.response
        });

        // Check if it's a configuration issue
        const appwriteDbError = dbError as AppwriteException;
        if (appwriteDbError.code === 404) {
          console.error('Database or collection not found. Please check your Appwrite configuration.');
          set({
            error: 'Database or collection not found. Please check your Appwrite configuration.',
            isLoading: false
          });
        } else if (appwriteDbError.code === 401 || appwriteDbError.code === 403) {
          console.error('Authentication or permission error with Appwrite.');
          set({
            error: 'Authentication or permission error with Appwrite. Please check your API keys and permissions.',
            isLoading: false
          });
        } else {
          console.warn('Database error, creating local order:', dbError);
          set({
            error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
            isLoading: false
          });
        }

        // Create a local order object with a temporary ID as fallback
        const tempOrder: Order = {
          id: 'local-' + Date.now(),
          items: currentOrder,
          status: 'Pending',
          total,
          phoneNumber,
          createdBy: 'current-user-id',
          createdAt: now,
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        };

        // Don't clear the current order here - let the UI component handle this
        // based on whether the entire operation (including printing) was successful

        return tempOrder;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create order',
        isLoading: false
      });
      return null;
    }
  },

  fetchOrders: async () => {
    // If already loading, don't make another request
    if (get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          ORDERS_COLLECTION_ID,
          [
            Query.orderDesc('createdAt'),
          ]
        );

        const orders = response.documents.map(doc => ({
          id: doc.$id,
          items: doc.items ? JSON.parse(doc.items) : [], // Parse the JSON string back to an array
          status: doc.status,
          total: doc.total,
          phoneNumber: doc.phoneNumber,
          createdBy: doc.createdBy,
          createdAt: new Date(doc.createdAt),
          orderNumber: doc.orderNumber || `ORD-${doc.$id.substring(0, 6)}`, // Fallback if orderNumber is missing
        })) as Order[];

        set({ orders, isLoading: false });
      } catch (dbError) {
        // Handle database not found or collection not found errors gracefully
        console.warn('Database or collection not found, using empty orders list:', dbError);
        set({ orders: [], isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        isLoading: false
      });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    set({ isLoading: true, error: null });

    try {
      try {
        await databases.updateDocument(
          DATABASE_ID,
          ORDERS_COLLECTION_ID,
          orderId,
          { status }
        );

        const orders = get().orders.map(order =>
          order.id === orderId ? { ...order, status } : order
        );

        set({ orders, isLoading: false });
      } catch (dbError) {
        // Handle database not found or collection not found errors gracefully
        console.warn('Database or collection not found, cannot update order status:', dbError);
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update order status',
        isLoading: false
      });
    }
  },
}));
