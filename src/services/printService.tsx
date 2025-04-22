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

// Function to print receipt using WebUSB
export const printReceipt = async (order: Order, config: ReceiptConfig = DEFAULT_RECEIPT_CONFIG): Promise<boolean> => {
  try {
    // Generate receipt data using react-thermal-printer's render function
    const receiptJSX = generateReceiptJSX(order, config);
    const data = await render(receiptJSX);

    // Request a USB device
    const device = await navigator.usb.requestDevice({
      filters: [{ vendorId: 0x0416 }] // Example vendor ID, you'll need to use the correct one for your printer
    });

    // Open connection to the printer
    await device.open();

    // Claim interface (usually interface 0)
    await device.claimInterface(0);

    // Get the output endpoint
    const endpointNumber = 1; // This may vary depending on your printer

    // Send the data to the printer
    await device.transferOut(endpointNumber, data);

    // Close the connection
    await device.close();

    return true;
  } catch (error) {
    console.error('Error printing receipt:', error);
    return false;
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
