/**
 * Utility functions for printer detection and debugging
 * Supports both Web Serial API (COM ports) and WebUSB API (direct USB)
 */

// Common baud rates for thermal printers
export const COMMON_BAUD_RATES = [9600, 19200, 38400, 57600, 115200];

// Common thermal printer vendor IDs for WebUSB
export const THERMAL_PRINTER_VENDORS = [
  { vendorId: 0x04b8, name: 'Epson' },
  { vendorId: 0x0519, name: 'Star Micronics' },
  { vendorId: 0x0fe6, name: 'ICS Advent' },
  { vendorId: 0x0dd4, name: 'Deltec' },
  { vendorId: 0x154f, name: 'SNBC' },
  { vendorId: 0x0483, name: 'STMicroelectronics' },
  { vendorId: 0x1fc9, name: 'NXP Semiconductors' },
  { vendorId: 0x1a86, name: 'QinHeng Electronics' },
  { vendorId: 0x067b, name: 'Prolific Technology' },
  { vendorId: 0x10c4, name: 'Silicon Labs' },
];

// Printer connection types
export type PrinterConnectionType = 'usb' | 'serial' | 'unknown';

export interface PrinterInfo {
  type: PrinterConnectionType;
  name: string;
  vendorId?: number;
  productId?: number;
  port?: SerialPort;
  device?: USBDevice;
  isConnected: boolean;
}

// Function to detect USB thermal printers
export const detectUSBPrinters = async (): Promise<PrinterInfo[]> => {
  const printers: PrinterInfo[] = [];

  try {
    if (!navigator.usb) {
      console.log('WebUSB API is not supported in this browser');
      return printers;
    }

    // Get all authorized USB devices
    const devices = await navigator.usb.getDevices();
    console.log(`Found ${devices.length} authorized USB devices`);

    for (const device of devices) {
      // Check if device matches known thermal printer vendors
      const vendor = THERMAL_PRINTER_VENDORS.find(v => v.vendorId === device.vendorId);

      if (vendor) {
        printers.push({
          type: 'usb',
          name: `${vendor.name} USB Printer`,
          vendorId: device.vendorId,
          productId: device.productId,
          device: device,
          isConnected: device.opened
        });
        console.log(`Found thermal printer: ${vendor.name} (${device.vendorId}:${device.productId})`);
      }
    }

    return printers;
  } catch (error) {
    console.error('Error detecting USB printers:', error);
    return printers;
  }
};

// Function to detect and log connected serial ports
export const detectSerialPorts = async (): Promise<PrinterInfo[]> => {
  const printers: PrinterInfo[] = [];

  try {
    if (!navigator.serial) {
      console.log('Web Serial API is not supported in this browser');
      return printers;
    }

    // Get all authorized ports
    const ports = await navigator.serial.getPorts();
    console.log(`Found ${ports.length} authorized serial ports`);

    for (let i = 0; i < ports.length; i++) {
      const port = ports[i];
      printers.push({
        type: 'serial',
        name: `Serial Port ${i + 1}`,
        port: port,
        isConnected: port.readable !== null || port.writable !== null
      });
      console.log(`Port ${i + 1}:`, port);
    }

    if (ports.length === 0) {
      console.log('No previously authorized serial ports found. Use "Select Printer" to choose a port.');
    }

    return printers;
  } catch (error) {
    console.error('Error detecting serial ports:', error);
    return printers;
  }
};

// Function to detect all available printers (USB + Serial)
export const detectAllPrinters = async (): Promise<PrinterInfo[]> => {
  const [usbPrinters, serialPrinters] = await Promise.all([
    detectUSBPrinters(),
    detectSerialPorts()
  ]);

  return [...usbPrinters, ...serialPrinters];
};

// Function to request access to a USB thermal printer
export const requestUSBPrinter = async (): Promise<USBDevice | void> => {
  try {
    if (!navigator.usb) {
      console.error('WebUSB API is not supported in this browser');
      return;
    }

    // Request USB device with thermal printer vendor filters
    const device = await navigator.usb.requestDevice({
      filters: THERMAL_PRINTER_VENDORS.map(vendor => ({ vendorId: vendor.vendorId }))
    });

    console.log('Selected USB printer:', device);
    return device;
  } catch (error) {
    console.error('Error requesting USB printer:', error);
    throw error;
  }
};

// Function to request access to a printer serial port and log its details
export const requestSerialPrinter = async (): Promise<SerialPort | void> => {
  try {
    if (!navigator.serial) {
      console.error('Web Serial API is not supported in this browser');
      return;
    }

    // Request any serial port (user will select from a list)
    const port = await navigator.serial.requestPort({ filters: [] });

    console.log('Selected serial port:', port);
    return port;
  } catch (error) {
    console.error('Error requesting serial printer:', error);
    throw error;
  }
};

// Legacy function for backward compatibility
export const identifyPrinter = async (): Promise<SerialPort | void> => {
  return requestSerialPrinter();
};

// Function to test a USB printer connection
export const testUSBConnection = async (device?: USBDevice): Promise<boolean> => {
  try {
    if (!navigator.usb) {
      console.error('WebUSB API is not supported in this browser');
      return false;
    }

    let targetDevice = device;

    if (!targetDevice) {
      // Get first available USB printer
      const devices = await navigator.usb.getDevices();
      const printerDevice = devices.find(d =>
        THERMAL_PRINTER_VENDORS.some(v => v.vendorId === d.vendorId)
      );

      if (!printerDevice) {
        console.log('No USB thermal printer found');
        return false;
      }

      targetDevice = printerDevice;
    }

    // Try to open the device
    if (!targetDevice.opened) {
      await targetDevice.open();
    }

    // Claim the interface (usually interface 0 for printers)
    await targetDevice.claimInterface(0);

    console.log('USB printer connection successful');

    // Send a test command (printer initialization)
    // ESC @ - Initialize printer
    const initCommand = new Uint8Array([0x1B, 0x40]);

    // Find the output endpoint (usually endpoint 1 or 2)
    const config = targetDevice.configuration;
    const interface_ = config?.interfaces[0];
    const alternate = interface_?.alternates[0];
    const endpoint = alternate?.endpoints.find(ep => ep.direction === 'out');

    if (endpoint) {
      await targetDevice.transferOut(endpoint.endpointNumber, initCommand);
      console.log('Test command sent to USB printer');
    }

    // Close the device
    await targetDevice.close();

    return true;
  } catch (error) {
    console.error('Error testing USB connection:', error);
    return false;
  }
};

// Function to test a serial connection with specific settings
export const testSerialConnection = async (baudRate: number = 9600, port?: SerialPort): Promise<boolean> => {
  try {
    if (!navigator.serial) {
      console.error('Web Serial API is not supported in this browser');
      return false;
    }

    let targetPort = port;

    if (!targetPort) {
      // Request port if not already authorized
      const ports = await navigator.serial.getPorts();

      if (ports.length > 0) {
        targetPort = ports[0];
      } else {
        targetPort = await navigator.serial.requestPort({ filters: [] });
      }
    }

    // Try to open the port with the specified baud rate
    await targetPort.open({
      baudRate: baudRate,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      bufferSize: 4096,
      flowControl: 'none'
    });

    console.log(`Serial port opened successfully with baud rate ${baudRate}`);

    // Send a test command (printer initialization)
    const writer = targetPort.writable?.getWriter();

    if (writer) {
      // ESC @ - Initialize printer
      const initCommand = new Uint8Array([0x1B, 0x40]);
      await writer.write(initCommand);

      // Release the writer
      writer.releaseLock();
    }

    // Close the port
    await targetPort.close();

    return true;
  } catch (error) {
    console.error(`Error testing serial connection with baud rate ${baudRate}:`, error);
    return false;
  }
};

// Function to test printer connection (auto-detects USB or Serial)
export const testPrinterConnection = async (printerInfo?: PrinterInfo, baudRate: number = 9600): Promise<boolean> => {
  if (!printerInfo) {
    // Try to find any available printer
    const printers = await detectAllPrinters();
    if (printers.length === 0) {
      console.log('No printers found');
      return false;
    }
    printerInfo = printers[0];
  }

  if (printerInfo.type === 'usb' && printerInfo.device) {
    return testUSBConnection(printerInfo.device);
  } else if (printerInfo.type === 'serial' && printerInfo.port) {
    return testSerialConnection(baudRate, printerInfo.port);
  }

  return false;
};
