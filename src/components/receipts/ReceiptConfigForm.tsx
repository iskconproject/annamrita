import { useEffect, useState } from 'react';
import { ReceiptConfig } from '../../types/receipt';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';

interface ReceiptConfigFormProps {
  config: ReceiptConfig;
  onSubmit: (config: ReceiptConfig) => Promise<void>;
  isLoading: boolean;
  onFormChange?: (formData: ReceiptConfig) => void;
}

export const ReceiptConfigForm = ({ config, onSubmit, isLoading, onFormChange }: ReceiptConfigFormProps) => {
  const [formData, setFormData] = useState<ReceiptConfig>({
    ...config,
  });

  // Update form data when config changes from parent
  useEffect(() => {
    setFormData({
      ...config,
    });
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(updatedFormData);

    // Notify parent component of form changes for real-time preview
    if (onFormChange) {
      onFormChange(updatedFormData);
    }
  };

  const handleToggleChange = (name: string, checked: boolean) => {
    const updatedFormData = {
      ...formData,
      [name]: checked,
    };
    setFormData(updatedFormData);

    // Notify parent component of form changes for real-time preview
    if (onFormChange) {
      onFormChange(updatedFormData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="headerText">Header Text</Label>
              <Input
                id="headerText"
                name="headerText"
                value={formData.headerText}
                onChange={handleChange}
                placeholder="Enter header text"
                required
              />
              <p className="text-sm text-muted-foreground">
                This text appears at the top of the receipt
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="footerText">Footer Text</Label>
              <Input
                id="footerText"
                name="footerText"
                value={formData.footerText}
                onChange={handleChange}
                placeholder="Enter footer text"
                required
              />
              <p className="text-sm text-muted-foreground">
                This text appears at the bottom of the receipt
              </p>
            </div>


            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showQRCode">Show QR Code</Label>
                <p className="text-sm text-muted-foreground">
                  Display a QR code on the receipt
                </p>
              </div>
              <Switch
                id="showQRCode"
                checked={formData.showQRCode}
                onCheckedChange={(checked) => handleToggleChange('showQRCode', checked)}
              />
            </div>

            {formData.showQRCode && (
              <div className="grid gap-2">
                <Label htmlFor="qrCodeData">QR Code Data</Label>
                <Input
                  id="qrCodeData"
                  name="qrCodeData"
                  value={formData.qrCodeData || ''}
                  onChange={handleChange}
                  placeholder="Enter URL or text for QR code"
                  required={formData.showQRCode}
                />
                <p className="text-sm text-muted-foreground">
                  URL or text to encode in the QR code (e.g., donation link)
                </p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Button
              type="submit"
              variant="iskcon"
              className="w-full iskcon-shadow"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
