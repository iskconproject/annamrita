/**
 * Utility functions for printer detection and debugging
 */

// Common baud rates for thermal printers
export const COMMON_BAUD_RATES = [9600, 19200, 38400, 57600, 115200];

// Function to detect and log connected serial ports
export const detectSerialPorts = async (): Promise<void> => {
  try {
    if (!navigator.serial) {
      console.error('Web Serial API is not supported in this browser');
      return;
    }

    // Get all authorized ports
    const ports = await navigator.serial.getPorts();
    console.log(`Found ${ports.length} authorized serial ports`);

    if (ports.length > 0) {
      ports.forEach((port, index) => {
        console.log(`Port ${index + 1}:`, port);
      });
    } else {
      console.log('No previously authorized serial ports found. Use "Identify Printer" to select a port.');
    }

    return;
  } catch (error) {
    console.error('Error detecting serial ports:', error);
  }
};

// Function to request access to a printer serial port and log its details
export const identifyPrinter = async (): Promise<SerialPort | void> => {
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
    console.error('Error identifying printer port:', error);
    throw error;
  }
};

// Function to test a serial connection with specific settings
export const testSerialConnection = async (baudRate: number = 9600): Promise<boolean> => {
  try {
    if (!navigator.serial) {
      console.error('Web Serial API is not supported in this browser');
      return false;
    }

    // Request port if not already authorized
    let port;
    const ports = await navigator.serial.getPorts();

    if (ports.length > 0) {
      port = ports[0];
    } else {
      port = await navigator.serial.requestPort({ filters: [] });
    }

    // Try to open the port with the specified baud rate
    await port.open({
      baudRate: baudRate,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      bufferSize: 4096,
      flowControl: 'none'
    });

    console.log(`Serial port opened successfully with baud rate ${baudRate}`);

    // Send a test command (printer initialization)
    const writer = port.writable?.getWriter();

    if (writer) {
      // ESC @ - Initialize printer
      const initCommand = new Uint8Array([0x1B, 0x40]);
      await writer.write(initCommand);

      // Release the writer
      writer.releaseLock();
    }

    // Close the port
    await port.close();

    return true;
  } catch (error) {
    console.error(`Error testing serial connection with baud rate ${baudRate}:`, error);
    return false;
  }
};
