import { useState } from 'react';
import {
  detectAllPrinters,
  detectUSBPrinters,
  detectSerialPorts,
  requestUSBPrinter,
  requestSerialPrinter,
  testUSBConnection,
  testSerialConnection,
  COMMON_BAUD_RATES,
  PrinterInfo
} from '../../utils/printerUtils';

interface PrinterDiagnosticsProps {
  initialOpen?: boolean;
}

export const PrinterDiagnostics = ({ initialOpen = false }: PrinterDiagnosticsProps) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedBaudRate, setSelectedBaudRate] = useState(9600);
  const [, setDetectedPrinters] = useState<PrinterInfo[]>([]);

  const handleDetectAllPrinters = async () => {
    setIsLoading(true);
    setDiagnosticResult('Detecting all printers (USB and Serial)...');

    try {
      const printers = await detectAllPrinters();
      setDetectedPrinters(printers);

      if (printers.length > 0) {
        const usbCount = printers.filter(p => p.type === 'usb').length;
        const serialCount = printers.filter(p => p.type === 'serial').length;
        setDiagnosticResult(
          `Found ${printers.length} printer(s): ${usbCount} USB, ${serialCount} Serial. Check console for details (F12 > Console).`
        );
      } else {
        setDiagnosticResult('No printers detected. Try adding a printer first.');
      }
    } catch (error) {
      setDiagnosticResult(`Error detecting printers: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectUSBPrinters = async () => {
    setIsLoading(true);
    setDiagnosticResult('Detecting USB thermal printers...');

    try {
      const printers = await detectUSBPrinters();

      if (printers.length > 0) {
        setDiagnosticResult(`Found ${printers.length} USB thermal printer(s). Check console for details.`);
      } else {
        setDiagnosticResult('No USB thermal printers detected. Try adding a USB printer first.');
      }
    } catch (error) {
      setDiagnosticResult(`Error detecting USB printers: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectSerialPorts = async () => {
    setIsLoading(true);
    setDiagnosticResult('Detecting serial ports...');

    try {
      const printers = await detectSerialPorts();

      if (printers.length > 0) {
        setDiagnosticResult(`Found ${printers.length} serial port(s). Check console for details.`);
      } else {
        setDiagnosticResult('No serial ports detected. Try adding a serial printer first.');
      }
    } catch (error) {
      setDiagnosticResult(`Error detecting serial ports: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestUSBPrinter = async () => {
    setIsLoading(true);
    setDiagnosticResult('Please select your USB printer from the dialog...');

    try {
      const device = await requestUSBPrinter();
      if (device) {
        setDiagnosticResult(`USB printer selected: ${device.productName || 'Unknown'}. Check console for details.`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        setDiagnosticResult('No USB printer was selected.');
      } else {
        setDiagnosticResult(`Error selecting USB printer: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSerialPrinter = async () => {
    setIsLoading(true);
    setDiagnosticResult('Please select your serial port from the dialog...');

    try {
      const port = await requestSerialPrinter();
      if (port) {
        setDiagnosticResult('Serial port selected. Check console for details.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        setDiagnosticResult('No serial port was selected.');
      } else {
        setDiagnosticResult(`Error selecting serial port: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestUSBConnection = async () => {
    setIsLoading(true);
    setDiagnosticResult('Testing USB printer connection...');

    try {
      const success = await testUSBConnection();
      if (success) {
        setDiagnosticResult('Successfully connected to USB printer. Check console for details.');
      } else {
        setDiagnosticResult('Failed to connect to USB printer. Make sure it\'s connected and try again.');
      }
    } catch (error) {
      setDiagnosticResult(`Error testing USB connection: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSerialConnection = async () => {
    setIsLoading(true);
    setDiagnosticResult(`Testing serial connection with baud rate ${selectedBaudRate}...`);

    try {
      const success = await testSerialConnection(selectedBaudRate);
      if (success) {
        setDiagnosticResult(`Successfully connected to serial printer with baud rate ${selectedBaudRate}. Check console for details.`);
      } else {
        setDiagnosticResult(`Failed to connect to serial printer with baud rate ${selectedBaudRate}. Try a different baud rate.`);
      }
    } catch (error) {
      setDiagnosticResult(`Error testing serial connection: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="mt-4 px-3 py-1 text-xs text-iskcon-primary bg-iskcon-light rounded-md hover:bg-opacity-80"
      >
        Printer Diagnostics
      </button>
    );
  }

  // Function to open Chrome Serial settings
  const openChromeSerialSettings = () => {
    window.open('chrome://settings/content/serialPorts', '_blank');
    setDiagnosticResult('Opening Chrome serial port settings. You may need to copy and paste the URL in a new tab: chrome://settings/content/serialPorts');
  };

  // Function to open Windows printer troubleshooter
  const openWindowsPrinterTroubleshooter = () => {
    setDiagnosticResult('Opening Windows printer troubleshooter...');
    // This command opens the Windows printer troubleshooter
    window.open('ms-settings:troubleshoot', '_blank');
  };

  // Function to open Windows Device Manager
  const openDeviceManager = () => {
    setDiagnosticResult('Opening Windows Device Manager...');
    // This opens Device Manager where you can check COM ports
    window.open('devmgmt.msc', '_blank');
  };

  // Function to test a direct print using the browser's print dialog
  const testBrowserPrint = () => {
    window.print();
    setDiagnosticResult('Browser print dialog opened. Try printing a test page.');
  };

  return (
    <div className="mt-4 p-4 border border-gray-100 rounded-md bg-gray-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-700">Printer Diagnostics</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {/* Detection Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            onClick={handleDetectAllPrinters}
            disabled={isLoading}
            className="px-3 py-1 text-xs text-white bg-iskcon-primary rounded-md hover:bg-iskcon-dark disabled:opacity-70"
          >
            Detect All Printers
          </button>

          <button
            onClick={handleDetectUSBPrinters}
            disabled={isLoading || !navigator.usb}
            className="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-70"
          >
            Detect USB Printers
          </button>

          <button
            onClick={handleDetectSerialPorts}
            disabled={isLoading || !navigator.serial}
            className="px-3 py-1 text-xs text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-70"
          >
            Detect Serial Ports
          </button>
        </div>

        {/* Add Printer Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            onClick={handleRequestUSBPrinter}
            disabled={isLoading || !navigator.usb}
            className="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-70"
          >
            Add USB Printer
          </button>

          <button
            onClick={handleRequestSerialPrinter}
            disabled={isLoading || !navigator.serial}
            className="px-3 py-1 text-xs text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-70"
          >
            Add Serial Printer
          </button>
        </div>

        {/* Test Connection Buttons */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTestUSBConnection}
              disabled={isLoading || !navigator.usb}
              className="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-70"
            >
              Test USB Connection
            </button>

            <div className="text-xs text-gray-700">Baud Rate:</div>
            <select
              value={selectedBaudRate}
              onChange={(e) => setSelectedBaudRate(Number(e.target.value))}
              className="text-xs border border-gray-300 rounded px-2 py-1"
              disabled={isLoading}
            >
              {COMMON_BAUD_RATES.map(rate => (
                <option key={rate} value={rate}>{rate}</option>
              ))}
            </select>

            <button
              onClick={handleTestSerialConnection}
              disabled={isLoading || !navigator.serial}
              className="px-3 py-1 text-xs text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-70"
            >
              Test Serial Connection
            </button>
          </div>
        </div>

        {diagnosticResult && (
          <div className="p-2 text-xs bg-white border border-gray-100 rounded-md">
            {diagnosticResult}
          </div>
        )}

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-iskcon-primary hover:text-iskcon-dark flex items-center"
        >
          {showAdvanced ? '▼ Hide' : '▶ Show'} Advanced Options
        </button>

        {showAdvanced && (
          <div className="p-2 border border-gray-100 rounded-md bg-white">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Advanced Options</h4>
            <div className="space-y-2">
              <button
                onClick={openChromeSerialSettings}
                className="w-full px-3 py-1 text-xs text-left text-gray-700 bg-iskcon-light rounded-md hover:bg-opacity-80"
              >
                Reset Chrome Serial Permissions
              </button>

              <button
                onClick={openWindowsPrinterTroubleshooter}
                className="w-full px-3 py-1 text-xs text-left text-gray-700 bg-iskcon-light rounded-md hover:bg-opacity-80"
              >
                Open Windows Printer Troubleshooter
              </button>

              <button
                onClick={openDeviceManager}
                className="w-full px-3 py-1 text-xs text-left text-gray-700 bg-iskcon-light rounded-md hover:bg-opacity-80"
              >
                Open Device Manager
              </button>

              <button
                onClick={testBrowserPrint}
                className="w-full px-3 py-1 text-xs text-left text-gray-700 bg-iskcon-light rounded-md hover:bg-opacity-80"
              >
                Test Browser Print Dialog
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-iskcon-primary">💡</span>
            Troubleshooting Guide
          </h4>

          {/* USB Thermal Printers Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600">🔌</span>
              <h5 className="text-sm font-medium text-blue-700">USB Thermal Printers</h5>
            </div>
            <div className="space-y-2">
              {[
                "Make sure your USB thermal printer is connected and powered on",
                "Use Chrome or Edge browser (WebUSB API is not supported in all browsers)",
                "Click \"Add USB Printer\" to select your printer from the device list",
                "Supported brands: Epson, Star Micronics, SNBC, and others",
                "If your printer doesn't appear, try a different USB port or cable"
              ].map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-blue-700">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Serial/COM Port Printers Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600">📡</span>
              <h5 className="text-sm font-medium text-green-700">Serial/COM Port Printers</h5>
            </div>
            <div className="space-y-2">
              {[
                "Make sure your printer is connected and powered on",
                "Use Chrome or Edge browser (Web Serial API is not supported in all browsers)",
                "Click \"Add Serial Printer\" to choose your printer's COM port",
                "Check Device Manager to confirm the COM port number (e.g., COM1, COM3)",
                "Try different baud rates (common rates: 9600, 19200, 38400, 57600, 115200)"
              ].map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-green-700">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connection Errors Section */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600">⚠️</span>
              <h5 className="text-sm font-medium text-red-700">Connection Errors</h5>
            </div>
            <div className="space-y-2">
              {[
                "Close any other applications that might be using the printer",
                "Disconnect and reconnect the printer",
                "Restart your browser",
                "Make sure the printer driver is installed correctly (for Serial printers)",
                "For USB printers, try a different USB port or cable"
              ].map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-red-700">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* General Tips Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-600">ℹ️</span>
              <h5 className="text-sm font-medium text-gray-700">General Tips</h5>
            </div>
            <div className="space-y-2">
              {[
                "Check browser console (F12) for detailed error logs",
                "Try refreshing the page after reconnecting the printer",
                "USB printers are generally more reliable than Serial/COM port connections",
                "If your printer shows as \"USB001\" in Windows, it should appear as a COM port",
                "Some printers require specific initialization commands"
              ].map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Permissions Section */}
          <div className="bg-iskcon-light border border-iskcon-primary/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-iskcon-primary">🔄</span>
              <h5 className="text-sm font-medium text-iskcon-primary">Reset Permissions</h5>
            </div>
            <div className="space-y-2 text-xs text-iskcon-dark">
              <div className="flex items-start gap-2">
                <span className="font-medium text-iskcon-primary">USB:</span>
                <span>In Chrome, go to chrome://settings/content/usbDevices</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-iskcon-primary">Serial:</span>
                <span>In Chrome, go to chrome://settings/content/serialPorts</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                You can remove previously granted permissions and try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
