import { useState, useEffect } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { printReceipt, printReceiptFallback, printReceiptAuto, printReceiptsByCategory, printReceiptsByCategoryFallback, printReceiptsByCategoryAuto, groupItemsByCategory } from '../../services/printService.tsx';
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
  const [useCategoryBasedPrinting, setUseCategoryBasedPrinting] = useState(true);

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
  const [useAutoDetection, setUseAutoDetection] = useState(true); // Default to auto-detection

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
          let printResult;

          if (useCategoryBasedPrinting) {
            // Check if order has items from multiple categories
            const categoryGroups = groupItemsByCategory(order);
            const categories = Object.keys(categoryGroups);

            if (categories.length > 1) {
              console.log(`🏷️ Order has items from ${categories.length} categories: ${categories.join(', ')}`);
              console.log('Using category-based printing...');

              if (useFallbackPrinting) {
                printResult = await printReceiptsByCategoryFallback(order, config);
              } else if (useAutoDetection) {
                printResult = await printReceiptsByCategoryAuto(order, config);
              } else {
                printResult = await printReceiptsByCategory(order, config, false);
              }

              // Handle category-based printing results
              if (printResult.success) {
                setOrderSuccess(true);
                setOrderMessage(`Order #${order.orderNumber} was successfully placed and ${categories.length} category-based receipts were printed.`);
              } else {
                const failedCategories = Object.entries(printResult.results)
                  .filter(([, success]) => !success)
                  .map(([category]) => category);

                if (failedCategories.length === categories.length) {
                  throw new Error(`Failed to print all category receipts: ${Object.values(printResult.errors).join(', ')}`);
                } else {
                  setOrderSuccess(true);
                  setOrderMessage(`Order #${order.orderNumber} was successfully placed. ${categories.length - failedCategories.length}/${categories.length} category receipts printed successfully. Failed: ${failedCategories.join(', ')}`);
                }
              }
            } else {
              // Single category, use regular printing
              console.log(`🏷️ Order has items from single category: ${categories[0]}`);
              console.log('Using regular printing...');

              if (useFallbackPrinting) {
                await printReceiptFallback(order, config);
              } else if (useAutoDetection) {
                await printReceiptAuto(order, config);
              } else {
                await printReceipt(order, config, false);
              }

              setOrderSuccess(true);
              setOrderMessage(`Order #${order.orderNumber} was successfully placed and receipt printed.`);
            }
          } else {
            // Use regular single receipt printing
            if (useFallbackPrinting) {
              await printReceiptFallback(order, config);
            } else if (useAutoDetection) {
              await printReceiptAuto(order, config);
            } else {
              await printReceipt(order, config, false);
            }

            setOrderSuccess(true);
            setOrderMessage(`Order #${order.orderNumber} was successfully placed and receipt printed.`);
          }

          // Only clear the current order on successful order creation
          clearCurrentOrder();
        } catch (error: unknown) {
          // Handle specific print errors
          console.error('Print error:', error);

          // Cast to Error if possible for type safety
          const printError = error instanceof Error ? error : new Error(String(error));

          // Provide specific error messages based on the error type
          if (!useFallbackPrinting) {
            if (printError.name === 'SecurityError' || printError.message?.includes('Access denied')) {
              setPrintError(
                'Printer access denied. Please ensure your USB printer is connected and you have granted permission to access it. ' +
                'Try clicking "Use Browser Printing" below as an alternative.'
              );
            } else if (printError.message?.includes('No compatible printer') || printError.message?.includes('No USB thermal printer found')) {
              setPrintError(
                'No compatible USB printer found. Please check that your thermal printer is connected via USB and powered on. ' +
                'You can also try "Use Browser Printing" below.'
              );
            } else if (printError.message?.includes('No printer port selected') || printError.message?.includes('No ports available')) {
              setPrintError(
                'No printer port available. Please ensure your printer is connected and try again. ' +
                'You can also use "Use Browser Printing" below.'
              );
            } else if (printError.message?.includes('Failed to open connection')) {
              setPrintError(
                'Could not connect to printer. The printer may be in use by another application or not powered on. ' +
                'Try closing other applications and ensure the printer is ready.'
              );
            } else {
              setPrintError(
                `Printer error: ${printError.message || 'Unknown error occurred'}. ` +
                'Try using "Use Browser Printing" below as an alternative.'
              );
            }
          } else {
            setPrintError(printError.message || 'Failed to print receipt using browser print dialog.');
          }

          // Show detailed error in console for debugging
          console.error('Print error details:', {
            message: printError.message,
            stack: printError.stack,
            name: printError.name
          });

          // Even if printing failed, the order was still placed successfully
          setOrderSuccess(true);
          setOrderMessage(`Order #${order.orderNumber} was successfully placed, but there was an issue with printing.`);
          // Only clear the current order on successful order creation
          clearCurrentOrder();
        }
      } else {
        // Order creation failed
        setOrderSuccess(false);
        setOrderMessage('Failed to create order. Please try again.');
        // Do NOT clear the current order when order creation fails
      }
    } catch (error) {
      console.error('Error creating order:', error);

      // Provide more specific error message if possible
      let errorMessage = 'Failed to create order. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error: Please check your internet connection and try again.';
        } else if (error.message.includes('permission') || error.message.includes('access')) {
          errorMessage = 'Permission error: You may not have access to create orders.';
        } else if (error.message.includes('database')) {
          errorMessage = 'Database error: There was an issue saving your order.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      setPrintError('Failed to create order.');
      setOrderSuccess(false);
      setOrderMessage(errorMessage);
      // Do NOT clear the current order when order creation fails
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

  const toggleAutoDetection = () => {
    setUseAutoDetection(!useAutoDetection);
    setPrintError(null);
    setOrderSuccess(null);
    setOrderMessage(null);
  };

  const toggleCategoryBasedPrinting = () => {
    setUseCategoryBasedPrinting(!useCategoryBasedPrinting);
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
                  {useCategoryBasedPrinting && (
                    <p className="text-xs text-iskcon-primary bg-iskcon-light px-2 py-1 rounded-full inline-block mt-1">
                      {item.category}
                    </p>
                  )}
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
            {useCategoryBasedPrinting && currentOrder.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {(() => {
                  const categories = [...new Set(currentOrder.map(item => item.category))];
                  return categories.length > 1 ? (
                    <span className="text-iskcon-primary font-medium">
                      📄 Will print {categories.length} separate receipts: {categories.join(', ')}
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      📄 Single receipt for {categories[0]}
                    </span>
                  );
                })()}
              </div>
            )}
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

          {/* Print Error Message */}
          {printError && (
            <div className="p-4 mt-4 text-sm text-red-700 bg-red-100 rounded-md flex items-start border border-red-300 shadow-sm animate-in fade-in duration-300">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Printer Error</h4>
                <span>{printError}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {orderSuccess === true && orderMessage && (
            <div className="p-4 mt-4 text-sm text-green-700 bg-green-100 rounded-md flex items-start border border-green-300 shadow-sm animate-in fade-in duration-300">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Order Successful</h4>
                <span>{orderMessage}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {orderSuccess === false && orderMessage && (
            <div className="p-4 mt-4 text-sm text-red-700 bg-red-100 rounded-md flex items-start border border-red-300 shadow-sm animate-in fade-in duration-300">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Order Failed</h4>
                <span>{orderMessage}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col mt-4 space-y-2">
            <div className="flex items-center">
              <button
                onClick={toggleCategoryBasedPrinting}
                type="button"
                className="text-xs text-iskcon-primary hover:text-iskcon-dark flex items-center"
              >
                <span className={`mr-2 ${useCategoryBasedPrinting ? 'bg-iskcon-primary' : 'bg-gray-300'} w-3 h-3 rounded-full`}></span>
                {useCategoryBasedPrinting ? 'Category-Based Receipts' : 'Single Receipt'}
              </button>
              <span className="ml-2 text-xs text-gray-500">
                {useCategoryBasedPrinting ? '(Separate receipts per category)' : '(One receipt for all items)'}
              </span>
            </div>

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
                  onClick={toggleAutoDetection}
                  type="button"
                  className="text-xs text-iskcon-primary hover:text-iskcon-dark flex items-center"
                >
                  <span className={`mr-2 ${useAutoDetection ? 'bg-iskcon-primary' : 'bg-gray-300'} w-3 h-3 rounded-full`}></span>
                  {useAutoDetection ? 'Auto-Detect Printer' : 'Manual Serial Mode'}
                </button>
                <span className="ml-2 text-xs text-gray-500">
                  {useAutoDetection ? '(USB/Serial auto-detection)' : '(Web Serial API only)'}
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
