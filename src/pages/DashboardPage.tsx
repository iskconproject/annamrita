import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMenuStore } from '../store/menuStore';
import { useOrderStore } from '../store/orderStore';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  ShoppingCart,
  CreditCard,
  Package,
  Users,
  TrendingUp,
  Settings,
  FileText,
  Plus
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { items } = useMenuStore();
  const { orders, fetchOrders } = useOrderStore();
  const [todayOrders, setTodayOrders] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

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

    // Generate weekly data for chart
    generateWeeklyData();
    generateCategoryData();
  }, [orders, items]);

  const generateWeeklyData = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDate = new Date();
    const data = [];

    // Generate data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(currentDate.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === date.getTime();
      });

      const daySales = dayOrders.reduce((total, order) => total + order.total, 0);

      data.push({
        name: days[date.getDay()].substring(0, 3),
        sales: daySales,
        orders: dayOrders.length
      });
    }

    setWeeklyData(data);
  };

  const generateCategoryData = () => {
    // Group menu items by category and count
    const categoryMap = new Map();

    items.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, 0);
      }
      categoryMap.set(item.category, categoryMap.get(item.category) + 1);
    });

    const data = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value
    }));

    setCategoryData(data);
  };

  // Colors for pie chart
  const COLORS = ['#F67F20', '#FFC107', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722'];

  return (
    <Layout>
      <div className="p-6">
        {/* Header with welcome message and user info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className='text-left'>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name || 'User'}</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            <span className="text-sm text-gray-600 mr-2">Today's Date:</span>
            <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-iskcon-primary">
            <CardContent className="p-6 flex items-center">
              <div className="mr-4 p-3 rounded-full bg-iskcon-light text-iskcon-primary">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Orders</p>
                <h3 className="text-2xl font-bold text-gray-900">{todayOrders}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-iskcon-secondary">
            <CardContent className="p-6 flex items-center">
              <div className="mr-4 p-3 rounded-full bg-iskcon-light text-iskcon-primary">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Sales</p>
                <h3 className="text-2xl font-bold text-gray-900">₹{todaySales.toFixed(2)}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-iskcon-accent">
            <CardContent className="p-6 flex items-center">
              <div className="mr-4 p-3 rounded-full bg-iskcon-light text-iskcon-primary">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Available Items</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {items.filter(item => item.available).length} / {items.length}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-iskcon-primary">
            <CardContent className="p-6 flex items-center">
              <div className="mr-4 p-3 rounded-full bg-iskcon-light text-iskcon-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <h3 className="text-2xl font-bold text-gray-900">{orders.length}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Weekly Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" name="Sales (₹)" fill="#F67F20" />
                    <Bar dataKey="orders" name="Orders" fill="#FFC107" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Menu Items by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <a href="/pos" className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-iskcon-light text-iskcon-primary mb-4">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">POS</h3>
                  <p className="mt-1 text-sm text-gray-500">Take orders and print bills</p>
                </a>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <a href="/orders" className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-iskcon-light text-iskcon-primary mb-4">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Orders</h3>
                  <p className="mt-1 text-sm text-gray-500">View and manage orders</p>
                </a>
              </CardContent>
            </Card>

            {user?.role === 'admin' && (
              <>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <a href="/menu" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-iskcon-light text-iskcon-primary mb-4">
                        <Plus className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Menu</h3>
                      <p className="mt-1 text-sm text-gray-500">Manage menu items</p>
                    </a>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <a href="/users" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-iskcon-light text-iskcon-primary mb-4">
                        <Users className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Users</h3>
                      <p className="mt-1 text-sm text-gray-500">Manage user accounts</p>
                    </a>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <a href="/reports" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-iskcon-light text-iskcon-primary mb-4">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Reports</h3>
                      <p className="mt-1 text-sm text-gray-500">View sales reports</p>
                    </a>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <a href="/receipt-config" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-iskcon-light text-iskcon-primary mb-4">
                        <Settings className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Receipt</h3>
                      <p className="mt-1 text-sm text-gray-500">Configure receipt layout</p>
                    </a>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
