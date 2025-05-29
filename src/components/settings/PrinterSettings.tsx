import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Printer,
  Usb,
  Wifi,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  TestTube
} from 'lucide-react';
import {
  detectAllPrinters,
  requestUSBPrinter,
  requestSerialPrinter,
  testPrinterConnection,
  PrinterInfo,
  THERMAL_PRINTER_VENDORS
} from '../../utils/printerUtils';
import { PrinterDiagnostics } from '../pos/PrinterDiagnostics';

export const PrinterSettings = () => {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterInfo | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Load printers on component mount
  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    setIsLoading(true);
    try {
      const detectedPrinters = await detectAllPrinters();
      setPrinters(detectedPrinters);
    } catch (error) {
      console.error('Error loading printers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUSBPrinter = async () => {
    try {
      setIsLoading(true);
      const device = await requestUSBPrinter();
      if (device) {
        await loadPrinters(); // Refresh the list
      }
    } catch (error) {
      console.error('Error adding USB printer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSerialPrinter = async () => {
    try {
      setIsLoading(true);
      const port = await requestSerialPrinter();
      if (port) {
        await loadPrinters(); // Refresh the list
      }
    } catch (error) {
      console.error('Error adding serial printer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPrinter = async (printer: PrinterInfo) => {
    try {
      setIsLoading(true);
      const result = await testPrinterConnection(printer);
      setTestResults(prev => ({
        ...prev,
        [`${printer.type}-${printer.name}`]: result
      }));
    } catch (error) {
      console.error('Error testing printer:', error);
      setTestResults(prev => ({
        ...prev,
        [`${printer.type}-${printer.name}`]: false
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'usb':
        return <Usb className="h-4 w-4" />;
      case 'serial':
        return <Wifi className="h-4 w-4" />;
      default:
        return <Printer className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (printer: PrinterInfo) => {
    const testKey = `${printer.type}-${printer.name}`;
    const testResult = testResults[testKey];

    if (testResult === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (testResult === false) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else if (printer.isConnected) {
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Printer Settings
          </CardTitle>
          <CardDescription>
            Configure and manage your thermal receipt printers. Supports both USB and Serial connections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Connected Printers</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPrinters}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {printers.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No printers detected. Add a printer using the buttons below.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {printers.map((printer, index) => (
                  <div
                    key={`${printer.type}-${index}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {getConnectionIcon(printer.type)}
                      <div>
                        <div className="font-medium">{printer.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {printer.type.toUpperCase()}
                          </Badge>
                          {printer.vendorId && (
                            <span>VID: {printer.vendorId.toString(16).toUpperCase()}</span>
                          )}
                          {printer.productId && (
                            <span>PID: {printer.productId.toString(16).toUpperCase()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(printer)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestPrinter(printer)}
                        disabled={isLoading}
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Add Printers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Add New Printer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Usb className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium">USB Thermal Printer</h4>
                    <p className="text-sm text-gray-500">Direct USB connection</p>
                  </div>
                </div>
                <Button
                  onClick={handleAddUSBPrinter}
                  disabled={isLoading || !navigator.usb}
                  className="w-full"
                >
                  Add USB Printer
                </Button>
                {!navigator.usb && (
                  <p className="text-xs text-red-500 mt-2">
                    WebUSB not supported in this browser
                  </p>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Wifi className="h-5 w-5 text-green-500" />
                  <div>
                    <h4 className="font-medium">Serial/COM Port</h4>
                    <p className="text-sm text-gray-500">Bluetooth or Serial connection</p>
                  </div>
                </div>
                <Button
                  onClick={handleAddSerialPrinter}
                  disabled={isLoading || !navigator.serial}
                  variant="outline"
                  className="w-full"
                >
                  Add Serial Printer
                </Button>
                {!navigator.serial && (
                  <p className="text-xs text-red-500 mt-2">
                    Web Serial not supported in this browser
                  </p>
                )}
              </Card>
            </div>
          </div>

          <Separator />

          {/* Supported Printers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Supported USB Printers</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {THERMAL_PRINTER_VENDORS.map((vendor) => (
                <Badge key={vendor.vendorId} variant="secondary" className="justify-center">
                  {vendor.name}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Other thermal printers may also work. Try the "Add USB Printer" option above.
            </p>
          </div>

          <Separator />

          {/* Advanced Diagnostics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Advanced Diagnostics</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
              </Button>
            </div>

            {showDiagnostics && (
              <PrinterDiagnostics initialOpen={true} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
