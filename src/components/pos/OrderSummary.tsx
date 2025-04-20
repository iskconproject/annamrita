import { useState } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { printReceipt } from '../../services/printService';

export const OrderSummary = () => {
  const { currentOrder, removeItemFromOrder, updateItemQuantity, clearCurrentOrder, calculateTotal, createOrder } = useOrderStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(itemId);
    } else {
      updateItemQuantity(itemId, quantity);
    }
  };

  const handleCreateOrder = async () => {
    setIsPrinting(true);
    setPrintError(null);
    
    try {
      const phone = phoneNumber.trim() ? phoneNumber : undefined;
      const order = await createOrder(phone);
      
      if (order) {
        // Try to print the receipt
        const printed = await printReceipt(order);
        
        if (!printed) {
          setPrintError('Failed to print receipt. Please check printer connection.');
        }
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setPrintError('Failed to create order.');
    } finally {
      setIsPrinting(false);
      setPhoneNumber('');
    }
  };

  const total = calculateTotal();

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900">Current Order</h2>
      
      {currentOrder.length === 0 ? (
        <p className="py-4 text-gray-500">No items in order</p>
      ) : (
        <div className="mt-4 space-y-4">
          {currentOrder.map((item) => (
            <div key={item.itemId} className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} each</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                  className="flex items-center justify-center w-8 h-8 text-white bg-red-500 rounded-full hover:bg-red-600"
                >
                  -
                </button>
                
                <span className="w-8 text-center">{item.quantity}</span>
                
                <button
                  onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                  className="flex items-center justify-center w-8 h-8 text-white bg-green-500 rounded-full hover:bg-green-600"
                >
                  +
                </button>
              </div>
              
              <div className="w-24 ml-4 text-right">
                ₹{(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
          
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-lg font-bold">₹{total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="pt-4 mt-4 border-t border-gray-200">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter customer phone"
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {printError && (
            <div className="p-3 mt-4 text-sm text-red-700 bg-red-100 rounded-md">
              {printError}
            </div>
          )}
          
          <div className="flex mt-6 space-x-4">
            <button
              onClick={clearCurrentOrder}
              className="flex-1 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear
            </button>
            
            <button
              onClick={handleCreateOrder}
              disabled={currentOrder.length === 0 || isPrinting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isPrinting ? 'Processing...' : 'Print & Complete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
