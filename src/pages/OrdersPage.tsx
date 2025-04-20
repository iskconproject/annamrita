import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { OrderList } from '../components/orders/OrderList';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';
import { OrderStatus } from '../types/order';

export const OrdersPage = () => {
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = statusFilter === 'All'
    ? orders
    : orders.filter(order => order.status === statusFilter);

  return (
    <Layout>
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center mt-4 space-x-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'All')}
              className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
        
        {/* Orders List */}
        <div className="mt-6 bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <OrderList 
              orders={filteredOrders} 
              showStatusControls={user?.role === 'admin' || user?.role === 'kitchen'} 
            />
          )}
        </div>
      </div>
    </Layout>
  );
};
