import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PrinterDiagnostics } from '../pos/PrinterDiagnostics';

export const PrinterSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Printer Settings</CardTitle>
        <CardDescription>
          Configure and test your receipt printer connection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Printer Diagnostics</h2>
            <p className="text-sm text-gray-600 mb-4">
              Use these tools to test your printer connection and troubleshoot any issues.
            </p>
            <PrinterDiagnostics initialOpen={true} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
