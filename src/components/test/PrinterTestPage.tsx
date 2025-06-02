import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Printer, TestTube, CheckCircle, XCircle } from 'lucide-react';
import {
  printReceiptUSB,
  printReceipt,
  printReceiptAuto,
  printReceiptFallback
} from '../../services/printService';
import { Order } from '../../types/order';
import { DEFAULT_RECEIPT_CONFIG } from '../../types/receipt';

// Sample test order
const testOrder: Order = {
  id: 'test-001',
  orderNumber: '2501270001',
  items: [
    {
      itemId: '1',
      name: 'Prasadam Thali',
      shortName: 'Thali',
      price: 150,
      quantity: 2
    },
    {
      itemId: '2',
      name: 'Kheer',
      shortName: 'Kheer',
      price: 50,
      quantity: 1
    }
  ],
  total: 350,
  phoneNumber: '+91 9876543210',
  createdAt: new Date(),
  status: 'Completed',
  createdBy: 'test-user'
};

export const PrinterTestPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const runTest = async (testName: string, testFunction: () => Promise<boolean>) => {
    setIsLoading(true);
    try {
      const success = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success, message: success ? 'Test passed successfully!' : 'Test failed.' }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const testUSBPrinting = () => runTest('usb', () => printReceiptUSB(testOrder, DEFAULT_RECEIPT_CONFIG));
  const testSerialPrinting = () => runTest('serial', () => printReceipt(testOrder, DEFAULT_RECEIPT_CONFIG));
  const testAutoPrinting = () => runTest('auto', () => printReceiptAuto(testOrder, DEFAULT_RECEIPT_CONFIG));
  const testFallbackPrinting = () => runTest('fallback', () => printReceiptFallback(testOrder, DEFAULT_RECEIPT_CONFIG));

  const getTestIcon = (testName: string) => {
    const result = testResults[testName];
    if (!result) return null;
    return result.success ?
      <CheckCircle className="h-4 w-4 text-green-500" /> :
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getTestBadge = (testName: string) => {
    const result = testResults[testName];
    if (!result) return null;
    return (
      <Badge variant={result.success ? "default" : "destructive"} className="ml-2">
        {result.success ? "PASS" : "FAIL"}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Printer Testing Suite
          </CardTitle>
          <CardDescription>
            Test all printer connection methods with a sample receipt. This helps verify USB and Serial printer functionality.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Order Preview */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Test Order Details</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm space-y-1">
                <div><strong>Order #:</strong> {testOrder.orderNumber}</div>
                <div><strong>Phone:</strong> {testOrder.phoneNumber}</div>
                <div><strong>Items:</strong></div>
                <ul className="ml-4 space-y-1">
                  {testOrder.items.map(item => (
                    <li key={item.itemId}>
                      {item.quantity} x {item.name} @ ₹{item.price} = ₹{item.quantity * item.price}
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t"><strong>Total: ₹{testOrder.total}</strong></div>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium">USB Printer Test</h4>
                  {getTestIcon('usb')}
                  {getTestBadge('usb')}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Tests direct USB thermal printer connection using WebUSB API.
              </p>
              <Button
                onClick={testUSBPrinting}
                disabled={isLoading || !navigator.usb}
                className="w-full"
                variant="outline"
              >
                Test USB Printing
              </Button>
              {!navigator.usb && (
                <p className="text-xs text-red-500 mt-2">WebUSB not supported</p>
              )}
              {testResults.usb && (
                <Alert className="mt-3">
                  <AlertDescription className="text-xs">
                    {testResults.usb.message}
                  </AlertDescription>
                </Alert>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium">Serial Printer Test</h4>
                  {getTestIcon('serial')}
                  {getTestBadge('serial')}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Tests COM port/Bluetooth printer connection using Web Serial API.
              </p>
              <Button
                onClick={testSerialPrinting}
                disabled={isLoading || !navigator.serial}
                className="w-full"
                variant="outline"
              >
                Test Serial Printing
              </Button>
              {!navigator.serial && (
                <p className="text-xs text-red-500 mt-2">Web Serial not supported</p>
              )}
              {testResults.serial && (
                <Alert className="mt-3">
                  <AlertDescription className="text-xs">
                    {testResults.serial.message}
                  </AlertDescription>
                </Alert>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-purple-500" />
                  <h4 className="font-medium">Auto Printer Test</h4>
                  {getTestIcon('auto')}
                  {getTestBadge('auto')}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Automatically detects and uses the best available printer (USB → Serial → Fallback).
              </p>
              <Button
                onClick={testAutoPrinting}
                disabled={isLoading}
                className="w-full"
              >
                Test Auto Printing
              </Button>
              {testResults.auto && (
                <Alert className="mt-3">
                  <AlertDescription className="text-xs">
                    {testResults.auto.message}
                  </AlertDescription>
                </Alert>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-orange-500" />
                  <h4 className="font-medium">Browser Print Test</h4>
                  {getTestIcon('fallback')}
                  {getTestBadge('fallback')}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Uses browser's built-in print dialog as fallback method.
              </p>
              <Button
                onClick={testFallbackPrinting}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                Test Browser Printing
              </Button>
              {testResults.fallback && (
                <Alert className="mt-3">
                  <AlertDescription className="text-xs">
                    {testResults.fallback.message}
                  </AlertDescription>
                </Alert>
              )}
            </Card>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertDescription>
              <strong>Testing Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Make sure your thermal printer is connected and powered on</li>
                <li>For USB printers: Connect via USB cable and test "USB Printer Test"</li>
                <li>For Serial/Bluetooth printers: Pair/connect first, then test "Serial Printer Test"</li>
                <li>Use "Auto Printer Test" for automatic detection and printing</li>
                <li>Check browser console (F12) for detailed logs</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
