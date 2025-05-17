import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { OrderList } from '../components/orders/OrderList';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';
import { OrderStatus } from '../types/order';
import { Card, CardContent } from '@/components/ui/card';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const OrdersPage = () => {
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = statusFilter === 'All'
    ? orders
    : orders.filter(order => order.status === statusFilter);

  // Calculate order statistics
  const pendingOrders = orders.filter(order => order.status === 'Pending').length;
  const preparingOrders = orders.filter(order => order.status === 'Preparing').length;
  const readyOrders = orders.filter(order => order.status === 'Ready').length;
  const completedOrders = orders.filter(order => order.status === 'Completed').length;

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header with title and refresh button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
          </div>
          <Button
            variant="outline"
            className="mt-4 md:mt-0 flex items-center gap-2"
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
          >
            <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center">
              <div className="mr-4 p-3 rounded-full bg-yellow-100 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <h3 className="text-xl font-bold text-gray-900">{pendingOrders}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center">
              <div className="mr-4 p-3 rounded-full bg-blue-100 text-blue-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Preparing</p>
                <h3 className="text-xl font-bold text-gray-900">{preparingOrders}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center">
              <div className="mr-4 p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Ready</p>
                <h3 className="text-xl font-bold text-gray-900">{readyOrders}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center">
              <div className="mr-4 p-3 rounded-full bg-gray-100 text-gray-600">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <h3 className="text-xl font-bold text-gray-900">{completedOrders}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-full sm:w-auto">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'All')}
                  className="block w-full py-2 pl-3 pr-10 text-base border-gray-300 rounded-md focus:outline-none focus:ring-iskcon-primary focus:border-iskcon-primary sm:text-sm"
                >
                  <option value="All">All Orders</option>
                  <option value="Pending">Pending</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <RefreshCcw className="h-8 w-8 text-iskcon-primary animate-spin mb-4" />
              <p className="text-gray-600">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">No orders found</p>
              <p className="text-gray-500 text-sm mt-1">
                {statusFilter !== 'All'
                  ? `There are no ${statusFilter.toLowerCase()} orders`
                  : 'No orders have been placed yet'}
              </p>
            </div>
          ) : (
            <OrderList
              orders={filteredOrders}
              showStatusControls={user?.role === 'admin' || user?.role === 'kitchen'}
            />
          )}
        </Card>
      </div>
    </Layout>
  );
};
