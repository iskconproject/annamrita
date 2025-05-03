import { Order } from '../types/order';
import { ReceiptConfig, DEFAULT_RECEIPT_CONFIG } from '../types/receipt';
import { Printer, Text, Line, Row, Br, Cut, render } from 'react-thermal-printer';

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
  return (
    <Printer type="epson" width={42}>
      <Text align="center" size={{ width: 2, height: 2 }}>{config.headerText}</Text>
      <Br />
      <Line />
      <Row left="Order #" right={order.id.substring(0, 8)} />
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
            left={`${item.quantity} x ${item.name}`}
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

// Function to print receipt using Web Serial API
export const printReceipt = async (order: Order, config: ReceiptConfig = DEFAULT_RECEIPT_CONFIG): Promise<boolean> => {
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

      if (ports.length > 0) {
        // Use the first available port (likely the printer)
        port = ports[0];
        console.log('Using previously authorized port:', port);
      } else {
        // If no ports are already authorized, request one
        console.log('No previously authorized ports found, requesting port...');
        port = await navigator.serial.requestPort({
          // Optional filters to help user select the right device
          // You can add specific filters if you know details about your printer
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
  receipt += `Order #: ${order.id.substring(0, 8)}\n`;
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
    receipt += `${item.quantity} x ${item.name}\n`;
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
        <title>Receipt #${order.id.substring(0, 8)}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 300px;
            margin: 0 auto;
            padding: 10px;
          }
          .header {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
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
              max-width: 300px;
            }
            @page {
              size: 80mm 297mm; /* Standard thermal receipt size */
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">${config.headerText}</div>

        <div class="info">
          <div>Order #: ${order.id.substring(0, 8)}</div>
          <div>Date: ${formatDate(order.createdAt)}</div>
          <div>Time: ${formatTime(order.createdAt)}</div>
          ${order.phoneNumber ? `<div>Phone: ${order.phoneNumber}</div>` : ''}
        </div>

        <div class="items">
          <div style="border-bottom: 1px dashed #000; margin-bottom: 5px;">Items:</div>
          ${order.items.map(item => `
            <div class="item">
              <div>${item.quantity} x ${item.name}</div>
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

    // Write the HTML to the new window
    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    return true;
  } catch (error) {
    console.error('Error printing receipt with fallback method:', error);
    throw error;
  }
};
