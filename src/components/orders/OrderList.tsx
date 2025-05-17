import { useEffect } from 'react';
import { Order, OrderStatus } from '../../types/order';
import { useOrderStore } from '../../store/orderStore';
import { printReceipt } from '../../services/printService.tsx';
import { useReceiptConfigStore } from '../../store/receiptConfigStore';
import { Button } from '@/components/ui/button';
import {
  Printer,
  Clock,
  CheckCircle,
  Check,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

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
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return null;
      case 'Preparing':
        return <Clock className="h-3 w-3 mr-1" />;
      case 'Ready':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'Completed':
        return <Check className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-iskcon-light">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-iskcon-primary uppercase"
            >
              Order ID
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-iskcon-primary uppercase"
            >
              Date & Time
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-iskcon-primary uppercase"
            >
              Items
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-iskcon-primary uppercase"
            >
              Total
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-iskcon-primary uppercase"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-iskcon-primary uppercase"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  #{order.id.substring(0, 8)}
                </div>
                {order.phoneNumber && (
                  <div className="text-xs text-gray-500 mt-1">
                    Ph: {order.phoneNumber}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                <div className="text-xs text-gray-500 mt-1">{formatTime(order.createdAt)}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 space-y-1">
                  {order.items.map((item) => (
                    <div key={item.itemId} className="flex justify-between">
                      <span>{item.quantity} × {item.name}</span>
                      <span className="text-gray-500 ml-2">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-iskcon-primary">
                  ₹{order.total.toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full border flex items-center w-fit",
                    getStatusColor(order.status)
                  )}
                >
                  {getStatusIcon(order.status)}
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 px-2 flex items-center gap-1"
                    onClick={() => handleReprintReceipt(order)}
                  >
                    <Printer className="h-3 w-3" />
                    <span>Receipt</span>
                  </Button>

                  {showStatusControls && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        {order.status !== 'Preparing' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order.id, 'Preparing')}
                            className="text-blue-600 focus:text-blue-600 cursor-pointer"
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            <span>Mark Preparing</span>
                          </DropdownMenuItem>
                        )}
                        {order.status !== 'Ready' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order.id, 'Ready')}
                            className="text-green-600 focus:text-green-600 cursor-pointer"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Mark Ready</span>
                          </DropdownMenuItem>
                        )}
                        {order.status !== 'Completed' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order.id, 'Completed')}
                            className="text-gray-600 focus:text-gray-600 cursor-pointer"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            <span>Mark Completed</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
