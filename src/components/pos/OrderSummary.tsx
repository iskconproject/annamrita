import { useState, useEffect } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { printReceipt, printReceiptFallback } from '../../services/printService.tsx';
import { useReceiptConfigStore } from '../../store/receiptConfigStore';
import { CheckCircle, AlertCircle } from 'lucide-react';

export const OrderSummary = () => {
  const { currentOrder, removeItemFromOrder, updateItemQuantity, clearCurrentOrder, calculateTotal, createOrder } = useOrderStore();
  const { config, fetchConfig } = useReceiptConfigStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<boolean | null>(null);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);

  // Only fetch receipt config if it's not already loaded
  useEffect(() => {
    if (!config) {
      fetchConfig();
    }
  }, [config, fetchConfig]);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(itemId);
    } else {
      updateItemQuantity(itemId, quantity);
    }
  };

  const [useFallbackPrinting, setUseFallbackPrinting] = useState(false);
  const [useSpecificPort, setUseSpecificPort] = useState(true); // Default to using USB001 port

  const handleCreateOrder = async () => {
    setIsPrinting(true);
    setPrintError(null);
    setOrderSuccess(null);
    setOrderMessage(null);

    try {
      const phone = phoneNumber.trim() ? phoneNumber : undefined;
      const order = await createOrder(phone);

      if (order) {
        try {
          if (useFallbackPrinting) {
            // Use browser print dialog method if fallback is enabled
            await printReceiptFallback(order, config);
          } else {
            // Try to print the receipt with direct connection
            // Pass the useSpecificPort flag to target USB001 port
            await printReceipt(order, config, useSpecificPort);
          }
          // If we get here, printing was successful
          setOrderSuccess(true);
          setOrderMessage(`Order #${order.id.substring(0, 8)} was successfully placed and receipt printed.`);
        } catch (error: unknown) {
          // Handle specific print errors
          console.error('Print error:', error);

          // Cast to Error if possible for type safety
          const printError = error instanceof Error ? error : new Error(String(error));

          // If this is a WebUSB error and we haven't tried fallback yet, suggest it
          if (!useFallbackPrinting &&
            (printError.name === 'SecurityError' ||
              printError.message?.includes('Access denied') ||
              printError.message?.includes('No compatible printer'))) {
            setPrintError(
              'Failed to print using direct printer connection. ' +
              'Would you like to try printing using the browser print dialog instead? ' +
              'Click "Use Browser Printing" below.'
            );
          } else {
            setPrintError(printError.message || 'Failed to print receipt. Please check printer connection.');
          }

          // Show detailed error in console for debugging
          console.error('Print error details:', {
            message: printError.message,
            stack: printError.stack,
            name: printError.name
          });

          // Even if printing failed, the order was still placed successfully
          setOrderSuccess(true);
          setOrderMessage(`Order #${order.id.substring(0, 8)} was successfully placed, but there was an issue with printing.`);
        }
      } else {
        // Order creation failed
        setOrderSuccess(false);
        setOrderMessage('Failed to create order. Please try again.');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setPrintError('Failed to create order.');
      setOrderSuccess(false);
      setOrderMessage('Failed to create order. Please try again.');
    } finally {
      setIsPrinting(false);
      setPhoneNumber('');
    }
  };

  const togglePrintingMethod = () => {
    setUseFallbackPrinting(!useFallbackPrinting);
    setPrintError(null);
    setOrderSuccess(null);
    setOrderMessage(null);
  };

  const total = calculateTotal();

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Order</h2>

      {currentOrder.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">No items in order</p>
          <p className="text-sm text-gray-400 mt-2">Select items from the menu to add them to your order</p>
        </div>
      ) : (
        <div className="space-y-4 text-left text-sm">
          <div className="max-h-[300px] overflow-y-auto pr-2">
            {currentOrder.map((item) => (
              <div key={item.itemId} className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} each</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                    className="flex items-center justify-center w-8 h-8 text-white bg-iskcon-primary rounded-md hover:bg-iskcon-dark"
                  >
                    -
                  </button>

                  <span className="w-8 text-center">{item.quantity}</span>

                  <button
                    onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                    className="flex items-center justify-center w-8 h-8 text-white bg-iskcon-primary rounded-md hover:bg-iskcon-dark"
                  >
                    +
                  </button>
                </div>

                <div className="w-24 ml-4 text-right font-medium">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-lg font-bold text-iskcon-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-4 mt-4">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter customer phone"
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-iskcon-primary focus:border-iskcon-primary"
            />
          </div>

          {printError && (
            <div className="p-3 mt-4 text-sm text-red-700 bg-red-100 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{printError}</span>
            </div>
          )}

          {orderSuccess === true && orderMessage && (
            <div className="p-3 mt-4 text-sm text-green-700 bg-green-100 rounded-md flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{orderMessage}</span>
            </div>
          )}

          {orderSuccess === false && orderMessage && (
            <div className="p-3 mt-4 text-sm text-red-700 bg-red-100 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{orderMessage}</span>
            </div>
          )}

          <div className="flex flex-col mt-4 space-y-2">
            <div className="flex items-center">
              <button
                onClick={togglePrintingMethod}
                type="button"
                className="text-xs text-iskcon-primary hover:text-iskcon-dark flex items-center"
              >
                <span className={`mr-2 ${useFallbackPrinting ? 'bg-iskcon-primary' : 'bg-gray-300'} w-3 h-3 rounded-full`}></span>
                {useFallbackPrinting ? 'Using Browser Printing' : 'Use Browser Printing'}
              </button>

              {useFallbackPrinting && (
                <span className="ml-2 text-xs text-gray-500">
                  (Will open print dialog)
                </span>
              )}
            </div>

            {!useFallbackPrinting && (
              <div className="flex items-center">
                <button
                  onClick={() => setUseSpecificPort(!useSpecificPort)}
                  type="button"
                  className="text-xs text-iskcon-primary hover:text-iskcon-dark flex items-center"
                >
                  <span className={`mr-2 ${useSpecificPort ? 'bg-iskcon-primary' : 'bg-gray-300'} w-3 h-3 rounded-full`}></span>
                  {useSpecificPort ? 'Using USB001 Port' : 'Use USB001 Port'}
                </button>
                <span className="ml-2 text-xs text-gray-500">
                  (Direct connection to printer)
                </span>
              </div>
            )}
          </div>

          <div className="flex mt-6 space-x-4">
            <button
              onClick={clearCurrentOrder}
              className="flex-1 px-4 py-3 text-sm font-medium text-iskcon-primary bg-iskcon-light border border-transparent rounded-md hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-iskcon-primary"
            >
              Clear
            </button>

            <button
              onClick={handleCreateOrder}
              disabled={currentOrder.length === 0 || isPrinting}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-iskcon-primary border border-transparent rounded-md shadow-sm hover:bg-iskcon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-iskcon-primary disabled:opacity-70"
            >
              {isPrinting ? 'Processing...' : useFallbackPrinting ? 'Print with Browser & Complete' : 'Print & Complete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
