import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useOrderStore } from '../store/orderStore';
import { Order } from '../types/order';
import { Download, FileText, RefreshCw } from 'lucide-react';

export const ReportsPage = () => {
  const { orders, fetchOrders } = useOrderStore();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [topItems, setTopItems] = useState<{ name: string; quantity: number; revenue: number }[]>([]);
  const [dateRange, setDateRange] = useState('thisMonth');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    // Set default date range to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    setStartDate(firstDay);
    setEndDate(today);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      filterOrders();
    }
  }, [orders, startDate, endDate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const today = new Date();
    let start = new Date();

    switch (range) {
      case 'today':
        start = new Date(today);
        start.setHours(0, 0, 0, 0);
        setStartDate(start);
        setEndDate(today);
        break;
      case 'yesterday':
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        setStartDate(start);
        setEndDate(end);
        break;
      case 'thisWeek':
        start = new Date(today);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        setStartDate(start);
        setEndDate(today);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(start);
        setEndDate(today);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setStartDate(start);
        setEndDate(lastDayOfLastMonth);
        break;
      case 'custom':
        // Don't change dates, just switch to custom mode
        break;
    }
  };

  const filterOrders = () => {
    if (!startDate || !endDate) return;

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
      .sort((a, b) => b.revenue - a.revenue)
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
    link.setAttribute('download', `sales_report_${startDate ? startDate.toISOString().split('T')[0] : ''}_to_${endDate ? endDate.toISOString().split('T')[0] : ''}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="p-6 bg-background">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-iskcon-primary">Reports</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-md bg-iskcon-primary hover:bg-iskcon-dark"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
              <button
                onClick={exportToCSV}
                disabled={filteredOrders.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-md bg-iskcon-accent hover:bg-green-600 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex flex-col gap-2 md:flex-row md:items-end">
                <div>
                  <label htmlFor="date-range" className="block mb-2 text-sm font-medium text-gray-700">
                    Date Range
                  </label>
                  <select
                    id="date-range"
                    value={dateRange}
                    onChange={(e) => handleDateRangeChange(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-iskcon-primary focus:border-iskcon-primary"
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="thisWeek">This Week</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="start-date" className="block mb-2 text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    value={startDate ? startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-iskcon-primary focus:border-iskcon-primary"
                  />
                </div>

                <div>
                  <label htmlFor="end-date" className="block mb-2 text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    value={endDate ? endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-iskcon-primary focus:border-iskcon-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">Total Orders</h3>
                <div className="p-2 text-white rounded-full bg-iskcon-primary">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-iskcon-primary">{filteredOrders.length}</p>
              <p className="mt-2 text-sm text-gray-500">
                {startDate && endDate ? `From ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}` : ''}
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">Total Sales</h3>
                <div className="p-2 text-white rounded-full bg-iskcon-secondary">
                  <Download className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-iskcon-secondary">₹{totalSales.toFixed(2)}</p>
              <p className="mt-2 text-sm text-gray-500">
                {startDate && endDate ? `From ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}` : ''}
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">Average Order Value</h3>
                <div className="p-2 text-white rounded-full bg-iskcon-accent">
                  <Download className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-iskcon-accent">
                ₹{filteredOrders.length > 0 ? (totalSales / filteredOrders.length).toFixed(2) : '0.00'}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {startDate && endDate ? `From ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}` : ''}
              </p>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-iskcon-primary">Top Selling Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-iskcon-light">
                    <th className="p-3 text-left text-sm font-medium text-iskcon-primary">Item</th>
                    <th className="p-3 text-left text-sm font-medium text-iskcon-primary">Quantity Sold</th>
                    <th className="p-3 text-left text-sm font-medium text-iskcon-primary">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="p-3 text-sm text-gray-700">{item.quantity}</td>
                      <td className="p-3 text-sm font-medium text-iskcon-primary">₹{item.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                  {topItems.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-gray-500">
                        No data available for the selected date range
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
