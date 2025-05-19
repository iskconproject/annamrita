export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Completed';

export interface OrderItem {
  itemId: string;
  name: string;
  shortName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  phoneNumber?: string;
  createdBy: string;
  createdAt: Date;
  orderNumber: string;
}
