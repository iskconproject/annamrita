import { useState } from 'react';
import { detectSerialPorts, identifyPrinter, testSerialConnection, COMMON_BAUD_RATES } from '../../utils/printerUtils';

export const PrinterDiagnostics = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedBaudRate, setSelectedBaudRate] = useState(9600);

  const handleDetectPorts = async () => {
    setIsLoading(true);
    setDiagnosticResult('Detecting serial ports...');

    try {
      // Log to console
      await detectSerialPorts();
      setDiagnosticResult('Serial port detection complete. Check browser console for details (F12 > Console).');
    } catch (error) {
      setDiagnosticResult(`Error detecting ports: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdentifyPrinter = async () => {
    setIsLoading(true);
    setDiagnosticResult('Please select your printer from the dialog that appears...');

    try {
      await identifyPrinter();
      setDiagnosticResult('Printer port selected. Check browser console for details (F12 > Console).');
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        setDiagnosticResult('No printer port was selected or no compatible printer was found.');
      } else {
        setDiagnosticResult(`Error identifying printer: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setDiagnosticResult(`Testing printer connection with baud rate ${selectedBaudRate}...`);

    try {
      const success = await testSerialConnection(selectedBaudRate);
      if (success) {
        setDiagnosticResult(`Successfully connected to printer with baud rate ${selectedBaudRate}. Check console for details.`);
      } else {
        setDiagnosticResult(`Failed to connect to printer with baud rate ${selectedBaudRate}. Try a different baud rate.`);
      }
    } catch (error) {
      setDiagnosticResult(`Error testing connection: ${error instanceof Error ? error.message : String(error)}`);
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
        <div className="flex space-x-2">
          <button
            onClick={handleDetectPorts}
            disabled={isLoading}
            className="px-3 py-1 text-xs text-white bg-iskcon-primary rounded-md hover:bg-iskcon-dark disabled:opacity-70"
          >
            Detect Serial Ports
          </button>

          <button
            onClick={handleIdentifyPrinter}
            disabled={isLoading}
            className="px-3 py-1 text-xs text-white bg-iskcon-primary rounded-md hover:bg-iskcon-dark disabled:opacity-70"
          >
            Select Printer Port
          </button>
        </div>

        <div className="flex items-center space-x-2 mt-2">
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
            onClick={handleTestConnection}
            disabled={isLoading}
            className="px-3 py-1 text-xs text-white bg-iskcon-primary rounded-md hover:bg-iskcon-dark disabled:opacity-70"
          >
            Test Connection
          </button>
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

        <div className="text-xs text-gray-600">
          <p className="font-medium">Troubleshooting tips:</p>

          <p className="mt-2 font-medium">If you see "No printer port selected":</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Make sure your printer is connected and powered on</li>
            <li>Use Chrome or Edge browser (Web Serial API is not supported in all browsers)</li>
            <li>Click "Select Printer Port" to choose your printer's COM port</li>
            <li>Check Device Manager to confirm the COM port number (e.g., COM1, COM3)</li>
          </ul>

          <p className="mt-2 font-medium">If you see connection errors:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Try different baud rates (common rates: 9600, 19200, 38400, 57600, 115200)</li>
            <li>Close any other applications that might be using the printer</li>
            <li>Disconnect and reconnect the printer</li>
            <li>Restart your browser</li>
            <li>Make sure the printer driver is installed correctly</li>
          </ul>

          <p className="mt-2 font-medium">General tips:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Check browser console (F12) for detailed error logs</li>
            <li>Try refreshing the page after reconnecting the printer</li>
            <li>Look for your printer's COM port in Device Manager under "Ports (COM & LPT)"</li>
            <li>If your printer shows as "USB001" in Windows, it should appear as a COM port</li>
            <li>Some printers require specific initialization commands</li>
          </ul>

          <div className="mt-3 p-2 bg-iskcon-light border border-iskcon-primary/20 rounded-md">
            <p className="font-medium text-iskcon-primary">Need to reset Serial permissions?</p>
            <p className="mt-1">
              In Chrome, go to chrome://settings/content/serialPorts to manage serial port permissions.
              You can remove previously granted permissions and try again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
