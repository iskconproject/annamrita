import { Order } from '../types/order';
import { ReceiptConfig, DEFAULT_RECEIPT_CONFIG, PRINT_WIDTH_CONFIGS } from '../types/receipt';
import { Printer, Text, Line, Row, Br, Cut, render } from 'react-thermal-printer';
import { detectAllPrinters, THERMAL_PRINTER_VENDORS } from '../utils/printerUtils';

// Function to format date for receipt
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Function to format time for receipt
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Function to generate receipt JSX
export const generateReceiptJSX = (order: Order, config: ReceiptConfig = DEFAULT_RECEIPT_CONFIG) => {
  const printWidthConfig = PRINT_WIDTH_CONFIGS[config.printWidth || '58mm'];

  return (
    <Printer type="epson" width={printWidthConfig.thermalWidth}>
      <Text align="center" size={{ width: 1, height: 1 }}>{config.headerText}</Text>
      <Br />
      <Line />
      <Row left="Order #" right={order.orderNumber} />
      <Row left="Date" right={formatDate(order.createdAt)} />
      <Row left="Time" right={formatTime(order.createdAt)} />
      {order.phoneNumber && <Row left="Phone" right={order.phoneNumber} />}
      <Br />
      <Line />
      <Text bold={true}>Items:</Text>
      <Br />
      {order.items.map((item, index) => (
        <div key={index}>
          <Row
            left={`${item.quantity} x ${item.shortName || item.name}`}
            right={`Rs.${(item.price * item.quantity).toFixed(2)}`}
          />
          <Text>{`  @ Rs.${item.price.toFixed(2)} each`}</Text>
        </div>
      ))}
      <Line />
      <Row left="TOTAL" right={`Rs.${order.total.toFixed(2)}`} />
      <Br />
      <Text align="center">{config.footerText}</Text>
      <Cut />
    </Printer>
  );
};

// Function to print receipt using WebUSB API
export const printReceiptUSB = async (order: Order, config: ReceiptConfig = DEFAULT_RECEIPT_CONFIG): Promise<boolean> => {
  try {
    // Check if WebUSB API is supported
    if (!navigator.usb) {
      console.error('WebUSB API is not supported in this browser');
      throw new Error('WebUSB API is not supported in this browser. Please use Chrome or Edge.');
    }

    // Generate receipt data using react-thermal-printer's render function
    const receiptJSX = generateReceiptJSX(order, config);
    const data = await render(receiptJSX);

    console.log('Receipt data generated, attempting to connect to USB printer...');

    // Get available USB devices
    const devices = await navigator.usb.getDevices();

    // Find a thermal printer device
    const printerDevice = devices.find(device =>
      THERMAL_PRINTER_VENDORS.some(vendor => vendor.vendorId === device.vendorId)
    );

    let device = printerDevice;

    if (!device) {
      // If no authorized device found, request one
      console.log('No authorized USB printer found, requesting device...');
      try {
        device = await navigator.usb.requestDevice({
          filters: THERMAL_PRINTER_VENDORS.map(vendor => ({ vendorId: vendor.vendorId }))
        });
      } catch (err) {
        console.error('Error selecting USB device:', err);
        throw new Error('No USB printer selected. Please make sure your printer is connected and try again.');
      }
    }

    console.log('USB device selected, attempting to open...');

    try {
      // Open the device if not already open
      if (!device.opened) {
        await device.open();
      }

      // Select configuration (usually configuration 1)
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Claim the interface (usually interface 0 for printers)
      await device.claimInterface(0);

      console.log('USB device opened and interface claimed');
    } catch (error) {
      console.error('Error opening USB device:', error);
      throw new Error(
        'Failed to open connection to the USB printer. This could be because:\n' +
        '1. Another application is using the printer\n' +
        '2. The printer is not powered on\n' +
        '3. The printer is not properly connected\n\n' +
        'Try closing other applications, check if the printer is on, ' +
        'and make sure it\'s properly connected via USB.'
      );
    }

    try {
      console.log('Writing data to USB printer...');

      // Find the output endpoint (usually endpoint 1 or 2)
      const config = device.configuration;
      const interface_ = config?.interfaces[0];
      const alternate = interface_?.alternates[0];
      const endpoint = alternate?.endpoints.find(ep => ep.direction === 'out');

      if (!endpoint) {
        throw new Error('Could not find output endpoint for USB printer');
      }

      // Write the data to the printer
      const result = await device.transferOut(endpoint.endpointNumber, data);

      if (result.status !== 'ok') {
        throw new Error(`USB transfer failed with status: ${result.status}`);
      }

      console.log(`Data successfully sent to USB printer (${result.bytesWritten} bytes)`);
    } catch (error) {
      console.error('Error writing to USB printer:', error);
      throw new Error('Failed to send data to the USB printer. Please check the printer connection and try again.');
    } finally {
      // Always close the device when done
      try {
        await device.close();
        console.log('USB device closed');
      } catch (closeError) {
        console.warn('Error closing USB device:', closeError);
      }
    }

    return true;
  } catch (error) {
    console.error('Error printing receipt via USB:', error);
    throw error;
  }
};

// Function to print receipt using Web Serial API
export const printReceipt = async (order: Order, config: ReceiptConfig = DEFAULT_RECEIPT_CONFIG, useSpecificPort: boolean = false): Promise<boolean> => {
  try {
    // Check if Web Serial API is supported
    if (!navigator.serial) {
      console.error('Web Serial API is not supported in this browser');
      throw new Error('Web Serial API is not supported in this browser. Please use Chrome or Edge.');
    }

    // Generate receipt data using react-thermal-printer's render function
    const receiptJSX = generateReceiptJSX(order, config);
    const data = await render(receiptJSX);

    console.log('Receipt data generated, attempting to connect to printer...');

    let port;

    try {
      // First try to get any previously connected ports
      const ports = await navigator.serial.getPorts();

      if (useSpecificPort) {
        // Try to find the USB001 port specifically
        console.log('Attempting to use specific port USB001...');

        // Get all available ports
        const availablePorts = await navigator.serial.getPorts();

        // Look for a port with USB001 in the info (if available)
        // Note: This is implementation-dependent and may need adjustment
        const targetPort = availablePorts.find(p => {
          // The port info might be available in different ways depending on the browser
          // This is a best effort attempt to identify the USB001 port
          // Using toString() as a fallback since getInfo() might not be available in all browsers
          return p.toString().includes('USB001');
        });

        if (targetPort) {
          port = targetPort;
          console.log('Found and using specific USB001 port');
        } else if (ports.length > 0) {
          // Fallback to first available port if USB001 not found
          port = ports[0];
          console.log('Specific USB001 port not found, using first available port:', port);
        } else {
          // If no ports are available, request one
          console.log('No ports available, requesting port...');
          port = await navigator.serial.requestPort({
            filters: [] // No filters to allow selection of any port
          });
        }
      } else if (ports.length > 0) {
        // Use the first available port (likely the printer)
        port = ports[0];
        console.log('Using previously authorized port:', port);
      } else {
        // If no ports are already authorized, request one
        console.log('No previously authorized ports found, requesting port...');
        port = await navigator.serial.requestPort({
          // Optional filters to help user select the right device
          filters: []
        });
      }
    } catch (err) {
      console.error('Error selecting serial port:', err);
      throw new Error('No printer port selected. Please make sure your printer is connected and try again.');
    }

    console.log('Serial port selected, attempting to open...');

    // Configure serial port (common settings for thermal printers)
    // You might need to adjust these settings based on your specific printer
    const portOptions = {
      baudRate: 9600, // Common baud rates: 9600, 19200, 38400, 57600, 115200
      dataBits: 8,
      stopBits: 1,
      parity: 'none' as ParityType,
      bufferSize: 4096,
      flowControl: 'none' as const
    };

    try {
      await port.open(portOptions);
      console.log('Serial port opened with settings:', portOptions);
    } catch (error) {
      console.error('Error opening serial port:', error);
      throw new Error(
        'Failed to open connection to the printer. This could be because:\n' +
        '1. Another application is using the printer\n' +
        '2. The printer is not powered on\n' +
        '3. The printer connection settings are incorrect\n\n' +
        'Try closing other applications, check if the printer is on, ' +
        'and make sure it\'s properly connected.'
      );
    }

    try {
      console.log('Writing data to printer...');

      // Get a writer from the output stream
      const writer = port.writable?.getWriter();

      if (!writer) {
        throw new Error('Could not get writer for the serial port');
      }

      // Write the data to the printer
      await writer.write(data);

      // Release the writer lock so the port can be closed
      writer.releaseLock();

      console.log('Data successfully sent to printer');
    } catch (error) {
      console.error('Error writing to printer:', error);
      throw new Error('Failed to send data to the printer. Please check the printer connection and try again.');
    } finally {
      // Always close the port when done
      if (port.readable || port.writable) {
        await port.close();
        console.log('Serial port closed');
      }
    }

    return true;
  } catch (error) {
    console.error('Error printing receipt:', error);
    // Return the specific error message
    throw error;
  }
};

// Function to generate plain text receipt content (fallback)
export const generateReceiptContent = (order: Order, config: ReceiptConfig = DEFAULT_RECEIPT_CONFIG): string => {
  let receipt = '';

  // Header
  receipt += `${config.headerText}\n\n`;

  // Order details
  receipt += `Order #: ${order.orderNumber}\n`;
  receipt += `Date: ${formatDate(order.createdAt)}\n`;
  receipt += `Time: ${formatTime(order.createdAt)}\n`;
  if (order.phoneNumber) {
    receipt += `Phone: ${order.phoneNumber}\n`;
  }
  receipt += '\n';

  // Items
  receipt += 'Items:\n';
  receipt += '------------------------\n';
  order.items.forEach(item => {
    const itemTotal = item.price * item.quantity;
    receipt += `${item.quantity} x ${item.shortName || item.name}\n`;
    receipt += `  @ Rs.${item.price.toFixed(2)} = Rs.${itemTotal.toFixed(2)}\n`;
  });
  receipt += '------------------------\n';

  // Total
  receipt += `TOTAL: Rs.${order.total.toFixed(2)}\n\n`;

  // Footer
  receipt += `${config.footerText}\n`;

  return receipt;
};

// Fallback function to print receipt using browser's print dialog
export const printReceiptFallback = async (order: Order, config: ReceiptConfig = DEFAULT_RECEIPT_CONFIG): Promise<boolean> => {
  try {
    const printWidthConfig = PRINT_WIDTH_CONFIGS[config.printWidth || '58mm'];

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window. Please check your popup blocker settings.');
    }

    // Generate receipt HTML
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${order.orderNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: ${printWidthConfig.cssWidth};
            margin: 0 auto;
            padding: 8px;
          }
          .header {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
            line-height: 1.3;
          }
          .info {
            margin-bottom: 10px;
          }
          .items {
            margin-bottom: 10px;
          }
          .item {
            margin-bottom: 5px;
          }
          .total {
            font-weight: bold;
            margin-top: 10px;
            border-top: 1px dashed #000;
            padding-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 12px;
          }
          @media print {
            body {
              width: 100%;
              max-width: ${printWidthConfig.cssWidth};
            }
            @page {
              size: ${printWidthConfig.pageSize};
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">${config.headerText}</div>

        <div class="info">
          <div>Order #: ${order.orderNumber}</div>
          <div>Date: ${formatDate(order.createdAt)}</div>
          <div>Time: ${formatTime(order.createdAt)}</div>
          ${order.phoneNumber ? `<div>Phone: ${order.phoneNumber}</div>` : ''}
        </div>

        <div class="items">
          <div style="border-bottom: 1px dashed #000; margin-bottom: 5px;">Items:</div>
          ${order.items.map(item => `
            <div class="item">
              <div>${item.quantity} x ${item.shortName || item.name}</div>
              <div style="display: flex; justify-content: space-between;">
                <span>  @ Rs.${item.price.toFixed(2)} each</span>
                <span>Rs.${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="total">
          <div style="display: flex; justify-content: space-between;">
            <span>TOTAL:</span>
            <span>Rs.${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">${config.footerText}</div>

        <script>
          // Auto print when loaded
          window.onload = function() {
            window.print();
            // Close the window after printing (or after cancel)
            window.setTimeout(function() {
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    // Set the HTML content of the new window
    printWindow.document.open();
    // Using innerHTML to avoid document.write deprecation
    printWindow.document.documentElement.innerHTML = receiptHTML.replace(/<!DOCTYPE html>|<html>|<\/html>/gi, '');
    printWindow.document.close();

    return true;
  } catch (error) {
    console.error('Error printing receipt with fallback method:', error);
    throw error;
  }
};

// Enhanced print function that automatically detects and uses the best available printer
export const printReceiptAuto = async (order: Order, config: ReceiptConfig = DEFAULT_RECEIPT_CONFIG): Promise<boolean> => {
  try {
    console.log('🖨️ Auto-detecting best printer for receipt printing...');

    // First, try to detect available printers
    const printers = await detectAllPrinters();
    console.log(`🔍 Detected ${printers.length} printer(s):`, printers.map(p => `${p.name} (${p.type})`));

    if (printers.length === 0) {
      console.log('❌ No printers detected, falling back to browser print dialog');
      throw new Error('No compatible printers found. Please ensure your thermal printer is connected and powered on.');
    }

    // Prioritize USB printers over Serial printers (generally more reliable)
    const usbPrinters = printers.filter(p => p.type === 'usb');
    const serialPrinters = printers.filter(p => p.type === 'serial');

    console.log(`📊 Printer breakdown: ${usbPrinters.length} USB, ${serialPrinters.length} Serial`);

    let lastError: Error | null = null;

    // Try USB printers first
    if (usbPrinters.length > 0) {
      console.log(`🔌 Found ${usbPrinters.length} USB printer(s), attempting USB printing...`);
      for (const printer of usbPrinters) {
        console.log(`🖨️ Trying USB printer: ${printer.name}`);
        try {
          const result = await printReceiptUSB(order, config);
          console.log('✅ USB printing successful!');
          return result;
        } catch (usbError) {
          lastError = usbError instanceof Error ? usbError : new Error(String(usbError));
          console.warn(`❌ USB printer ${printer.name} failed:`, lastError.message);
        }
      }
    }

    // Try Serial printers if USB failed or not available
    if (serialPrinters.length > 0) {
      console.log(`📡 Found ${serialPrinters.length} serial printer(s), attempting serial printing...`);
      for (const printer of serialPrinters) {
        console.log(`🖨️ Trying Serial printer: ${printer.name}`);
        try {
          const result = await printReceipt(order, config, false);
          console.log('✅ Serial printing successful!');
          return result;
        } catch (serialError) {
          lastError = serialError instanceof Error ? serialError : new Error(String(serialError));
          console.warn(`❌ Serial printer ${printer.name} failed:`, lastError.message);
        }
      }
    }

    // If all direct printing methods failed, throw the last error
    console.log('❌ All direct printer methods failed');
    if (lastError) {
      throw lastError;
    } else {
      throw new Error('All available printers failed to print the receipt.');
    }

  } catch (error) {
    console.error('💥 Error in auto print function:', error);
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Function to group order items by category
export const groupItemsByCategory = (order: Order): { [category: string]: Order } => {
  const categoryGroups: { [category: string]: typeof order.items } = {};

  // Group items by category
  order.items.forEach(item => {
    if (!categoryGroups[item.category]) {
      categoryGroups[item.category] = [];
    }
    categoryGroups[item.category].push(item);
  });

  // Create separate orders for each category
  const categoryOrders: { [category: string]: Order } = {};

  Object.entries(categoryGroups).forEach(([category, items]) => {
    const categoryTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    categoryOrders[category] = {
      ...order,
      items,
      total: categoryTotal,
      // Add category suffix to order number to distinguish receipts
      orderNumber: `${order.orderNumber}-${category.replace(/\s+/g, '').toUpperCase()}`
    };
  });

  return categoryOrders;
};

// Function to generate category-specific receipt JSX
export const generateCategoryReceiptJSX = (order: Order, category: string, config: ReceiptConfig = DEFAULT_RECEIPT_CONFIG) => {
  const printWidthConfig = PRINT_WIDTH_CONFIGS[config.printWidth || '58mm'];

  return (
    <Printer type="epson" width={printWidthConfig.thermalWidth}>
      <Text align="center" size={{ width: 1, height: 1 }}>{config.headerText}</Text>
      <Br />
      <Line />
      <Row left="Order #" right={order.orderNumber} />
      <Row left="Category" right={category} />
      <Row left="Date" right={formatDate(order.createdAt)} />
      <Row left="Time" right={formatTime(order.createdAt)} />
      {order.phoneNumber && <Row left="Phone" right={order.phoneNumber} />}
      <Br />
      <Line />
      <Text bold={true}>Items ({category}):</Text>
      <Br />
      {order.items.map((item, index) => (
        <div key={index}>
          <Row
            left={`${item.quantity} x ${item.shortName || item.name}`}
            right={`Rs.${(item.price * item.quantity).toFixed(2)}`}
          />
          <Text>{`  @ Rs.${item.price.toFixed(2)} each`}</Text>
        </div>
      ))}
      <Line />
      <Row left="CATEGORY TOTAL" right={`Rs.${order.total.toFixed(2)}`} />
      <Br />
      <Text align="center">{config.footerText}</Text>
      <Text align="center">** {category} Counter **</Text>
      <Cut />
    </Printer>
  );
};

// Function to print receipts split by category using Web Serial API
export const printReceiptsByCategory = async (order: Order, config: ReceiptConfig = DEFAULT_RECEIPT_CONFIG, useSpecificPort: boolean = false): Promise<{ success: boolean; results: { [category: string]: boolean }; errors: { [category: string]: string } }> => {
  const categoryOrders = groupItemsByCategory(order);
  const categories = Object.keys(categoryOrders);

  console.log(`🏷️ Printing ${categories.length} category-based receipts:`, categories);

  const results: { [category: string]: boolean } = {};
  const errors: { [category: string]: string } = {};
  let overallSuccess = true;

  // Print each category receipt
  for (const category of categories) {
    const categoryOrder = categoryOrders[category];

    try {
      console.log(`🖨️ Printing receipt for category: ${category}`);

      // Check if Web Serial API is supported
      if (!navigator.serial) {
        throw new Error('Web Serial API is not supported in this browser. Please use Chrome or Edge.');
      }

      // Generate receipt data using the category-specific JSX
      const receiptJSX = generateCategoryReceiptJSX(categoryOrder, category, config);
      const data = await render(receiptJSX);

      // Get or request a serial port (similar to the main printReceipt function)
      let port;
      const ports = await navigator.serial.getPorts();

      if (useSpecificPort && ports.length > 0) {
        port = ports[0];
      } else if (ports.length > 0) {
        port = ports[0];
      } else {
        port = await navigator.serial.requestPort({ filters: [] });
      }

      // Configure and open the port
      const portOptions = {
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none' as ParityType,
        bufferSize: 4096,
        flowControl: 'none' as const
      };

      await port.open(portOptions);

      // Write data to printer
      const writer = port.writable?.getWriter();
      if (!writer) {
        throw new Error('Could not get writer for the serial port');
      }

      await writer.write(data);
      writer.releaseLock();

      // Close the port
      if (port.readable || port.writable) {
        await port.close();
      }

      results[category] = true;
      console.log(`✅ Successfully printed receipt for category: ${category}`);

      // Add a small delay between prints to avoid conflicts
      if (categories.indexOf(category) < categories.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to print receipt for category ${category}:`, errorMessage);
      results[category] = false;
      errors[category] = errorMessage;
      overallSuccess = false;
    }
  }

  return {
    success: overallSuccess,
    results,
    errors
  };
};

// Function to print receipts split by category using browser fallback
export const printReceiptsByCategoryFallback = async (order: Order, config: ReceiptConfig = DEFAULT_RECEIPT_CONFIG): Promise<{ success: boolean; results: { [category: string]: boolean }; errors: { [category: string]: string } }> => {
  const categoryOrders = groupItemsByCategory(order);
  const categories = Object.keys(categoryOrders);

  console.log(`🏷️ Printing ${categories.length} category-based receipts using browser fallback:`, categories);

  const results: { [category: string]: boolean } = {};
  const errors: { [category: string]: string } = {};
  let overallSuccess = true;

  // Print each category receipt
  for (const category of categories) {
    const categoryOrder = categoryOrders[category];

    try {
      console.log(`🖨️ Printing fallback receipt for category: ${category}`);

      const printWidthConfig = PRINT_WIDTH_CONFIGS[config.printWidth || '58mm'];

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Could not open print window. Please check your popup blocker settings.');
      }

      // Generate category-specific receipt HTML
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt #${categoryOrder.orderNumber} - ${category}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: ${printWidthConfig.cssWidth};
              margin: 0 auto;
              padding: 8px;
            }
            .header {
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
              word-wrap: break-word;
              overflow-wrap: break-word;
              hyphens: auto;
              line-height: 1.3;
            }
            .category {
              text-align: center;
              font-size: 13px;
              font-weight: bold;
              background-color: #f0f0f0;
              padding: 5px;
              margin-bottom: 10px;
              border: 1px solid #ccc;
            }
            .info {
              margin-bottom: 10px;
            }
            .items {
              margin-bottom: 10px;
            }
            .item {
              margin-bottom: 5px;
            }
            .total {
              font-weight: bold;
              margin-top: 10px;
              border-top: 1px dashed #000;
              padding-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              font-size: 12px;
            }
            .counter {
              text-align: center;
              font-weight: bold;
              margin-top: 10px;
              padding: 5px;
              background-color: #f9f9f9;
              border: 1px dashed #000;
            }
            @media print {
              body {
                width: 100%;
                max-width: ${printWidthConfig.cssWidth};
              }
              @page {
                size: ${printWidthConfig.pageSize};
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">${config.headerText}</div>
          <div class="category">CATEGORY: ${category}</div>

          <div class="info">
            <div>Order #: ${categoryOrder.orderNumber}</div>
            <div>Date: ${formatDate(categoryOrder.createdAt)}</div>
            <div>Time: ${formatTime(categoryOrder.createdAt)}</div>
            ${categoryOrder.phoneNumber ? `<div>Phone: ${categoryOrder.phoneNumber}</div>` : ''}
          </div>

          <div class="items">
            <div style="border-bottom: 1px dashed #000; margin-bottom: 5px;">Items (${category}):</div>
            ${categoryOrder.items.map(item => `
              <div class="item">
                <div>${item.quantity} x ${item.shortName || item.name}</div>
                <div style="display: flex; justify-content: space-between;">
                  <span>  @ Rs.${item.price.toFixed(2)} each</span>
                  <span>Rs.${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="total">
            <div style="display: flex; justify-content: space-between;">
              <span>CATEGORY TOTAL:</span>
              <span>Rs.${categoryOrder.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">${config.footerText}</div>
          <div class="counter">** ${category} Counter **</div>

          <script>
            // Auto print when loaded
            window.onload = function() {
              window.print();
              // Close the window after printing (or after cancel)
              window.setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
        </html>
      `;

      // Set the HTML content of the new window
      printWindow.document.open();
      printWindow.document.documentElement.innerHTML = receiptHTML.replace(/<!DOCTYPE html>|<html>|<\/html>/gi, '');
      printWindow.document.close();

      results[category] = true;
      console.log(`✅ Successfully opened print dialog for category: ${category}`);

      // Add a small delay between opening print windows
      if (categories.indexOf(category) < categories.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to print fallback receipt for category ${category}:`, errorMessage);
      results[category] = false;
      errors[category] = errorMessage;
      overallSuccess = false;
    }
  }

  return {
    success: overallSuccess,
    results,
    errors
  };
};

// Function to print receipts split by category using auto-detection
export const printReceiptsByCategoryAuto = async (order: Order, config: ReceiptConfig = DEFAULT_RECEIPT_CONFIG): Promise<{ success: boolean; results: { [category: string]: boolean }; errors: { [category: string]: string } }> => {
  const categoryOrders = groupItemsByCategory(order);
  const categories = Object.keys(categoryOrders);

  console.log(`🏷️ Auto-printing ${categories.length} category-based receipts:`, categories);

  const results: { [category: string]: boolean } = {};
  const errors: { [category: string]: string } = {};
  let overallSuccess = true;

  // Detect available printers once
  let printers;
  try {
    printers = await detectAllPrinters();
    console.log(`🔍 Detected ${printers.length} printer(s) for category printing`);
  } catch (error) {
    console.warn('Could not detect printers, will try fallback method');
    return await printReceiptsByCategoryFallback(order, config);
  }

  if (printers.length === 0) {
    console.log('❌ No printers detected, using fallback method');
    return await printReceiptsByCategoryFallback(order, config);
  }

  // Print each category receipt
  for (const category of categories) {
    const categoryOrder = categoryOrders[category];

    try {
      console.log(`🖨️ Auto-printing receipt for category: ${category}`);

      // Try to print using the best available method
      let printed = false;
      let lastError: Error | null = null;

      // Try USB printers first
      const usbPrinters = printers.filter(p => p.type === 'usb');
      if (usbPrinters.length > 0) {
        try {
          // Use USB printing logic (simplified version)
          if (!navigator.usb) {
            throw new Error('WebUSB API is not supported');
          }

          const devices = await navigator.usb.getDevices();
          const printerDevice = devices.find(device =>
            THERMAL_PRINTER_VENDORS.some(vendor => vendor.vendorId === device.vendorId)
          );

          if (!printerDevice) {
            throw new Error('No USB printer device found');
          }

          if (!printerDevice.opened) {
            await printerDevice.open();
          }
          if (printerDevice.configuration === null) {
            await printerDevice.selectConfiguration(1);
          }
          await printerDevice.claimInterface(0);

          const deviceConfig = printerDevice.configuration;
          const interface_ = deviceConfig?.interfaces[0];
          const alternate = interface_?.alternates[0];
          const endpoint = alternate?.endpoints.find(ep => ep.direction === 'out');

          if (!endpoint) {
            throw new Error('Could not find output endpoint');
          }

          // Generate receipt data using the category-specific JSX
          const receiptJSX = generateCategoryReceiptJSX(categoryOrder, category, config);
          const data = await render(receiptJSX);

          await printerDevice.transferOut(endpoint.endpointNumber, data);
          await printerDevice.close();

          printed = true;
        } catch (usbError) {
          lastError = usbError instanceof Error ? usbError : new Error(String(usbError));
          console.warn(`❌ USB printer failed for category ${category}:`, lastError.message);
        }
      }

      // Try Serial printers if USB failed
      if (!printed) {
        const serialPrinters = printers.filter(p => p.type === 'serial');
        if (serialPrinters.length > 0) {
          try {
            // Use the existing serial printing logic
            await printReceiptsByCategory(categoryOrder, config, false);
            printed = true;
          } catch (serialError) {
            lastError = serialError instanceof Error ? serialError : new Error(String(serialError));
            console.warn(`❌ Serial printer failed for category ${category}:`, lastError.message);
          }
        }
      }

      if (printed) {
        results[category] = true;
        console.log(`✅ Successfully printed receipt for category: ${category}`);
      } else {
        throw lastError || new Error('All printer methods failed');
      }

      // Add a small delay between prints to avoid conflicts
      if (categories.indexOf(category) < categories.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to auto-print receipt for category ${category}:`, errorMessage);
      results[category] = false;
      errors[category] = errorMessage;
      overallSuccess = false;
    }
  }

  return {
    success: overallSuccess,
    results,
    errors
  };
};
