import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useOrderStore } from '../store/orderStore';
import { Order } from '../types/order';

export const ReportsPage = () => {
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [topItems, setTopItems] = useState<{ name: string; quantity: number; revenue: number }[]>([]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    // Set default date range to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    setStartDate(formatDateForInput(firstDay));
    setEndDate(formatDateForInput(today));
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      filterOrders();
    }
  }, [orders, startDate, endDate]);

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const filterOrders = () => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const filtered = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });
    
    setFilteredOrders(filtered);
    
    // Calculate total sales
    const total = filtered.reduce((sum, order) => sum + order.total, 0);
    setTotalSales(total);
    
    // Calculate top selling items
    const itemsMap = new Map<string, { quantity: number; revenue: number }>();
    
    filtered.forEach(order => {
      order.items.forEach(item => {
        const existing = itemsMap.get(item.name) || { quantity: 0, revenue: 0 };
        itemsMap.set(item.name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.price * item.quantity),
        });
      });
    });
    
    const topItemsArray = Array.from(itemsMap.entries())
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
    
    setTopItems(topItemsArray);
  };

  const exportToCSV = () => {
    // Create CSV content
    let csvContent = 'Order ID,Date,Time,Items,Total,Status\n';
    
    filteredOrders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString();
      const time = new Date(order.createdAt).toLocaleTimeString();
      const items = order.items.map(item => `${item.quantity}x ${item.name}`).join('; ');
      const row = [
        order.id,
        date,
        time,
        items,
        order.total.toFixed(2),
        order.status,
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        
        {/* Date Range Selector */}
        <div className="flex flex-wrap items-end mt-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <button
              onClick={exportToCSV}
              disabled={filteredOrders.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              Export to CSV
            </button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-5 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900">Total Orders</h2>
            <p className="mt-2 text-3xl font-bold text-indigo-600">{filteredOrders.length}</p>
          </div>
          
          <div className="p-5 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900">Total Sales</h2>
            <p className="mt-2 text-3xl font-bold text-indigo-600">₹{totalSales.toFixed(2)}</p>
          </div>
          
          <div className="p-5 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900">Average Order Value</h2>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              ₹{filteredOrders.length > 0 ? (totalSales / filteredOrders.length).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
        
        {/* Top Selling Items */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Top Selling Items</h2>
          
          <div className="mt-4 overflow-hidden bg-white shadow sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Item
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Quantity Sold
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{item.revenue.toFixed(2)}</div>
                    </td>
                  </tr>
                ))}
                
                {topItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="text-sm text-gray-500">No data available</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};
