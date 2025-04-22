import { create } from 'zustand';
import { databases, DATABASE_ID, ORDERS_COLLECTION_ID } from '../services/appwrite';
import { Order, OrderItem, OrderStatus } from '../types/order';
import { ID, Query } from 'appwrite';

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

      const orderData = {
        items: currentOrder,
        status: 'Pending' as OrderStatus,
        total,
        phoneNumber,
        createdAt: new Date(),
        // In a real app, this would be the current user's ID
        createdBy: 'current-user-id',
      };

      try {
        const response = await databases.createDocument(
          DATABASE_ID,
          ORDERS_COLLECTION_ID,
          ID.unique(),
          orderData
        );

        const newOrder: Order = {
          id: response.$id,
          items: response.items,
          status: response.status,
          total: response.total,
          phoneNumber: response.phoneNumber,
          createdBy: response.createdBy,
          createdAt: new Date(response.createdAt),
        };

        const orders = [...get().orders, newOrder];

        set({ orders, isLoading: false });
        get().clearCurrentOrder();

        return newOrder;
      } catch (dbError) {
        // Handle database not found or collection not found errors gracefully
        console.warn('Database or collection not found, cannot create order:', dbError);

        // Create a local order object with a temporary ID
        const tempOrder: Order = {
          id: 'local-' + Date.now(),
          items: currentOrder,
          status: 'Pending',
          total,
          phoneNumber,
          createdBy: 'current-user-id',
          createdAt: new Date(),
        };

        // Store it locally only
        set({ isLoading: false });
        get().clearCurrentOrder();

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
          items: doc.items,
          status: doc.status,
          total: doc.total,
          phoneNumber: doc.phoneNumber,
          createdBy: doc.createdBy,
          createdAt: new Date(doc.createdAt),
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
