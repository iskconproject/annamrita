import { useEffect } from 'react';
import { Order, OrderStatus } from '../../types/order';
import { useOrderStore } from '../../store/orderStore';
import { printReceipt } from '../../services/printService.tsx';
import { useReceiptConfigStore } from '../../store/receiptConfigStore';

interface OrderListProps {
  orders: Order[];
  showStatusControls?: boolean;
}

export const OrderList = ({ orders, showStatusControls = false }: OrderListProps) => {
  const { updateOrderStatus } = useOrderStore();
  const { config, fetchConfig } = useReceiptConfigStore();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
  };

  const handleReprintReceipt = async (order: Order) => {
    try {
      // Use the USB001 port by default for reprinting
      await printReceipt(order, config, true);
    } catch (error) {
      console.error('Error reprinting receipt:', error);
      alert('Failed to print receipt. Please check printer connection.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Preparing':
        return 'bg-blue-100 text-blue-800';
      case 'Ready':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Order ID
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Date & Time
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Items
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Total
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {order.id.substring(0, 8)}
                </div>
                {order.phoneNumber && (
                  <div className="text-xs text-gray-500">{order.phoneNumber}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                <div className="text-sm text-gray-500">{formatTime(order.createdAt)}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {order.items.map((item) => (
                    <div key={item.itemId}>
                      {item.quantity} x {item.name}
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  ₹{order.total.toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                <button
                  onClick={() => handleReprintReceipt(order)}
                  className="mr-2 text-indigo-600 hover:text-indigo-900"
                >
                  Reprint
                </button>

                {showStatusControls && (
                  <div className="mt-2 space-y-1">
                    {order.status !== 'Preparing' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'Preparing')}
                        className="block text-xs text-blue-600 hover:text-blue-900"
                      >
                        Mark Preparing
                      </button>
                    )}

                    {order.status !== 'Ready' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'Ready')}
                        className="block text-xs text-green-600 hover:text-green-900"
                      >
                        Mark Ready
                      </button>
                    )}

                    {order.status !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'Completed')}
                        className="block text-xs text-gray-600 hover:text-gray-900"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
