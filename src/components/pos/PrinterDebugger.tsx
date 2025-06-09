import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Printer,
  Usb,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Play
} from 'lucide-react';
import {
  detectAllPrinters,
  testUSBConnection,
  requestUSBPrinter,
  PrinterInfo
} from '../../utils/printerUtils';
import { printReceiptUSB, printReceipt, printReceiptAuto } from '../../services/printService';
import { Order } from '../../types/order';
import { DEFAULT_RECEIPT_CONFIG } from '../../types/receipt';

export const PrinterDebugger = () => {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestingPrint, setIsTestingPrint] = useState(false);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const detectPrinters = async () => {
    setIsLoading(true);
    clearResults();
    addTestResult('🔍 Starting printer detection...');

    try {
      const detectedPrinters = await detectAllPrinters();
      setPrinters(detectedPrinters);
      addTestResult(`✅ Found ${detectedPrinters.length} printer(s)`);

      detectedPrinters.forEach(printer => {
        addTestResult(`📋 ${printer.name} (${printer.type}) - Connected: ${printer.isConnected ? 'Yes' : 'No'}`);
      });
    } catch (error) {
      addTestResult(`❌ Error detecting printers: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testUSBPrinter = async () => {
    addTestResult('🔌 Testing USB printer connection...');

    try {
      const result = await testUSBConnection();
      if (result) {
        addTestResult('✅ USB printer test successful!');
      } else {
        addTestResult('❌ USB printer test failed');
      }
    } catch (error) {
      addTestResult(`❌ USB test error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const requestUSBAccess = async () => {
    addTestResult('🔐 Requesting USB printer access...');

    try {
      const device = await requestUSBPrinter();
      if (device) {
        addTestResult(`✅ USB access granted for device: ${device.productName || 'Unknown'}`);
        // Refresh printer list
        await detectPrinters();
      }
    } catch (error) {
      addTestResult(`❌ USB access error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testPrintReceipt = async (method: 'usb' | 'serial' | 'auto') => {
    setIsTestingPrint(true);
    addTestResult(`🖨️ Testing ${method.toUpperCase()} printing...`);

    // Create a test order
    const testOrder: Order = {
      id: 'test-' + Date.now(),
      orderNumber: 'TEST001',
      items: [
        {
          itemId: '1',
          name: 'Test Item',
          shortName: 'Test',
          price: 10.00,
          quantity: 1,
          category: 'Test Category'
        }
      ],
      total: 10.00,
      createdAt: new Date(),
      phoneNumber: '1234567890',
      status: 'Completed',
      createdBy: 'test-user'
    };

    try {
      let result = false;

      switch (method) {
        case 'usb':
          result = await printReceiptUSB(testOrder, DEFAULT_RECEIPT_CONFIG);
          break;
        case 'serial':
          result = await printReceipt(testOrder, DEFAULT_RECEIPT_CONFIG, false);
          break;
        case 'auto':
          result = await printReceiptAuto(testOrder, DEFAULT_RECEIPT_CONFIG);
          break;
      }

      if (result) {
        addTestResult(`✅ ${method.toUpperCase()} printing successful!`);
      } else {
        addTestResult(`❌ ${method.toUpperCase()} printing failed`);
      }
    } catch (error) {
      addTestResult(`❌ ${method.toUpperCase()} print error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsTestingPrint(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Printer Debugger
        </CardTitle>
        <CardDescription>
          Debug and test your thermal printer connections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Detection Controls */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={detectPrinters}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Detect Printers
          </Button>

          <Button
            onClick={requestUSBAccess}
            variant="outline"
          >
            <Usb className="h-4 w-4 mr-2" />
            Request USB Access
          </Button>

          <Button
            onClick={testUSBPrinter}
            variant="outline"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Test USB Connection
          </Button>

          <Button
            onClick={clearResults}
            variant="outline"
          >
            Clear Results
          </Button>
        </div>

        {/* Detected Printers */}
        {printers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Detected Printers</h3>
            <div className="grid gap-3">
              {printers.map((printer, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {printer.type === 'usb' ? <Usb className="h-5 w-5" /> : <Printer className="h-5 w-5" />}
                    <div>
                      <div className="font-medium">{printer.name}</div>
                      <div className="text-sm text-gray-500">Type: {printer.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={printer.isConnected ? "default" : "secondary"}>
                      {printer.isConnected ? "Connected" : "Available"}
                    </Badge>
                    {printer.isConnected ?
                      <CheckCircle className="h-4 w-4 text-green-500" /> :
                      <XCircle className="h-4 w-4 text-gray-400" />
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print Test Controls */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Test Printing</h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => testPrintReceipt('auto')}
              disabled={isTestingPrint}
              className="bg-iskcon-primary hover:bg-iskcon-dark"
            >
              <Play className="h-4 w-4 mr-2" />
              Test Auto-Detect Print
            </Button>

            <Button
              onClick={() => testPrintReceipt('usb')}
              disabled={isTestingPrint}
              variant="outline"
            >
              <Usb className="h-4 w-4 mr-2" />
              Test USB Print
            </Button>

            <Button
              onClick={() => testPrintReceipt('serial')}
              disabled={isTestingPrint}
              variant="outline"
            >
              <Printer className="h-4 w-4 mr-2" />
              Test Serial Print
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Test Results</h3>
            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
              <div className="space-y-1 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div key={index} className="text-gray-700">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Instructions:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>First, click "Detect Printers" to see what's available</li>
              <li>If no USB printer is found, click "Request USB Access" and select your printer</li>
              <li>Test the connection with "Test USB Connection"</li>
              <li>Try printing with "Test Auto-Detect Print" (recommended) or specific methods</li>
              <li>Check the console (F12) for detailed debugging information</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
