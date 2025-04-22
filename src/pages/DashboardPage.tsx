import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMenuStore } from '../store/menuStore';
import { useOrderStore } from '../store/orderStore';
import { Layout } from '../components/layout/Layout';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { items } = useMenuStore();
  const { orders, fetchOrders } = useOrderStore();
  const [todayOrders, setTodayOrders] = useState(0);
  const [todaySales, setTodaySales] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    // Calculate today's orders and sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    setTodayOrders(filteredOrders.length);
    setTodaySales(filteredOrders.reduce((total, order) => total + order.total, 0));
  }, [orders]);

  return (
    <Layout>
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

        <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Today's Orders */}
          <div className="p-5 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900">Today's Orders</h2>
            <p className="mt-2 text-3xl font-bold text-indigo-600">{todayOrders}</p>
          </div>

          {/* Today's Sales */}
          <div className="p-5 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900">Today's Sales</h2>
            <p className="mt-2 text-3xl font-bold text-indigo-600">₹{todaySales.toFixed(2)}</p>
          </div>

          {/* Available Menu Items */}
          <div className="p-5 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900">Available Menu Items</h2>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {items.filter(item => item.available).length} / {items.length}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>

          <div className="grid grid-cols-1 gap-5 mt-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="/pos"
              className="flex items-center p-5 bg-indigo-50 rounded-lg shadow hover:bg-indigo-100"
            >
              <div className="flex-shrink-0 p-3 text-white bg-indigo-600 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">POS</h3>
                <p className="mt-1 text-sm text-gray-500">Take orders and print bills</p>
              </div>
            </a>

            <a
              href="/orders"
              className="flex items-center p-5 bg-indigo-50 rounded-lg shadow hover:bg-indigo-100"
            >
              <div className="flex-shrink-0 p-3 text-white bg-indigo-600 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Orders</h3>
                <p className="mt-1 text-sm text-gray-500">View and manage orders</p>
              </div>
            </a>

            {user?.role === 'admin' && (
              <>
                <a
                  href="/menu"
                  className="flex items-center p-5 bg-indigo-50 rounded-lg shadow hover:bg-indigo-100"
                >
                  <div className="flex-shrink-0 p-3 text-white bg-indigo-600 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Menu</h3>
                    <p className="mt-1 text-sm text-gray-500">Manage menu items</p>
                  </div>
                </a>

                <a
                  href="/users"
                  className="flex items-center p-5 bg-indigo-50 rounded-lg shadow hover:bg-indigo-100"
                >
                  <div className="flex-shrink-0 p-3 text-white bg-indigo-600 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Users</h3>
                    <p className="mt-1 text-sm text-gray-500">Manage user accounts</p>
                  </div>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
