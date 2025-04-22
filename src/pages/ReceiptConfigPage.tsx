import { useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { ReceiptConfigForm } from '../components/receipts/ReceiptConfigForm';
import { ReceiptPreview } from '../components/receipts/ReceiptPreview';
import { useReceiptConfigStore } from '../store/receiptConfigStore';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const ReceiptConfigPage = () => {
  const { config, isLoading, error, fetchConfig, updateConfig } = useReceiptConfigStore();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSubmit = async (updatedConfig: typeof config) => {
    await updateConfig(updatedConfig);
  };

  return (
    <Layout>
      <div className="container py-6 mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-iskcon-primary">Receipt Configuration</h1>
          <p className="text-muted-foreground">
            Customize how receipts appear when printed for customers
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <ReceiptConfigForm
              config={config}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <ReceiptPreview config={config} />
          </div>
        </div>
      </div>
    </Layout>
  );
};
