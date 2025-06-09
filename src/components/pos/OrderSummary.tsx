import { useState, useEffect } from 'react';
import { useOrderStore } from '../../store/orderStore';
import { printReceipt, printReceiptAuto, printReceiptsByCategory, printReceiptsByCategoryAuto, groupItemsByCategory } from '../../services/printService.tsx';
import { useReceiptConfigStore } from '../../store/receiptConfigStore';
import { AlertCircle } from 'lucide-react';
import { Order } from '../../types/order';
import { useToast } from '../../hooks/use-toast';

export const OrderSummary = () => {
  const { currentOrder, removeItemFromOrder, updateItemQuantity, clearCurrentOrder, calculateTotal, createOrder } = useOrderStore();
  const { config, fetchConfig } = useReceiptConfigStore();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [useCategoryBasedPrinting, setUseCategoryBasedPrinting] = useState(true);
  const [useAutoDetection, setUseAutoDetection] = useState(true); // Default to auto-detection

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

  const handleCreateOrder = async () => {
    setIsPrinting(true);
    setPrintError(null);

    try {
      const phone = phoneNumber.trim() ? phoneNumber : undefined;

      // Create a temporary order object for printing (without saving to database yet)
      const total = calculateTotal();
      const now = new Date();

      // Generate order number based on date and count
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear().toString();

      // For temporary order, use a simple counter (this will be regenerated when actually saving)
      const tempOrderNumber = `${day}${month}${year}01`; // Temporary number for printing

      const tempOrder: Order = {
        id: 'temp-' + Date.now(),
        items: currentOrder,
        status: 'Completed',
        total,
        phoneNumber: phone,
        createdBy: 'current-user-id',
        createdAt: now,
        orderNumber: tempOrderNumber,
      };

      // First, try to print the receipt
      try {
        console.log('🖨️ Attempting to print receipt before creating order...');

        if (useCategoryBasedPrinting) {
          // Check if order has items from multiple categories
          const categoryGroups = groupItemsByCategory(tempOrder);
          const categories = Object.keys(categoryGroups);

          if (categories.length > 1) {
            console.log(`🏷️ Order has items from ${categories.length} categories: ${categories.join(', ')}`);
            console.log('Using category-based printing...');

            const printResult = useAutoDetection
              ? await printReceiptsByCategoryAuto(tempOrder, config)
              : await printReceiptsByCategory(tempOrder, config, false);

            if (!printResult.success) {
              const failedCategories = Object.keys(printResult.errors);
              throw new Error(`Failed to print receipts for: ${failedCategories.join(', ')}`);
            }
          } else {
            // Single category, use regular printing
            console.log(`🏷️ Order has items from single category: ${categories[0]}`);
            console.log('Using regular printing...');

            if (useAutoDetection) {
              await printReceiptAuto(tempOrder, config);
            } else {
              await printReceipt(tempOrder, config, false);
            }
          }
        } else {
          // Use regular single receipt printing
          if (useAutoDetection) {
            await printReceiptAuto(tempOrder, config);
          } else {
            await printReceipt(tempOrder, config, false);
          }
        }

        // Printing was successful, now create the order in the database
        console.log('✅ Printing successful, creating order in database...');
        const order = await createOrder(phone);

        if (order) {
          // Show success toast notification
          toast({
            title: "Order Placed Successfully! 🎉",
            description: `Order #${order.orderNumber} was successfully placed and receipt printed.`,
            variant: "default",
          });

          // Only clear the current order on successful order creation and printing
          clearCurrentOrder();
        } else {
          throw new Error('Failed to save order to database after successful printing.');
        }

      } catch (printError: unknown) {
        // Handle specific print errors
        console.error('Print error:', printError);

        // Cast to Error if possible for type safety
        const error = printError instanceof Error ? printError : new Error(String(printError));

        // Provide specific error messages based on the error type
        let errorMessage = '';
        if (error.name === 'SecurityError' || error.message?.includes('Access denied')) {
          errorMessage = 'Printer access denied. Please ensure your printer is connected and you have granted permission to access it.';
        } else if (error.message?.includes('No compatible printer') || error.message?.includes('No USB thermal printer found')) {
          errorMessage = 'No compatible printer found. Please check that your thermal printer is connected and powered on.';
        } else if (error.message?.includes('No printer port selected') || error.message?.includes('No ports available')) {
          errorMessage = 'No printer port available. Please ensure your printer is connected and try again.';
        } else if (error.message?.includes('Failed to open connection')) {
          errorMessage = 'Could not connect to printer. The printer may be in use by another application or not powered on.';
        } else {
          errorMessage = `Printer error: ${error.message || 'Unknown error occurred'}. Please fix the printer issue and try again.`;
        }

        // Show error toast notification
        toast({
          title: "Printing Failed ❌",
          description: `Order not placed due to printing failure. ${errorMessage}`,
          variant: "destructive",
        });

        setPrintError(errorMessage);

        // Show detailed error in console for debugging
        console.error('Print error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });

        // Do NOT create order or clear current order if printing failed
      }

    } catch (error) {
      console.error('Error in order process:', error);

      // Provide more specific error message if possible
      let errorMessage = 'Failed to process order. Please try again.';
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

      // Show error toast notification
      toast({
        title: "Order Failed ❌",
        description: errorMessage,
        variant: "destructive",
      });

      setPrintError(null);
      // Do NOT clear the current order when order creation fails
    } finally {
      setIsPrinting(false);
      setPhoneNumber('');
    }
  };

  const toggleAutoDetection = () => {
    setUseAutoDetection(!useAutoDetection);
    setPrintError(null);
  };

  const toggleCategoryBasedPrinting = () => {
    setUseCategoryBasedPrinting(!useCategoryBasedPrinting);
    setPrintError(null);
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
                  ) : null;
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

          {/* Success and error messages are now handled by toast notifications */}

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
              {isPrinting ? 'Processing...' : 'Print & Complete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
