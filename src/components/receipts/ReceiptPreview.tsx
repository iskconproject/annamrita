import { ReceiptConfig } from '../../types/receipt';
import { Card, CardContent } from '../../components/ui/card';
import { Order, OrderItem } from '../../types/order';

interface ReceiptPreviewProps {
  config: ReceiptConfig;
}

export const ReceiptPreview = ({ config }: ReceiptPreviewProps) => {
  // Create a sample order for preview
  const sampleOrder: Order = {
    id: 'sample-123456789',
    items: [
      {
        itemId: 'item1',
        name: 'Vegetable Pulao',
        shortName: 'Veg Pulao',
        quantity: 2,
        price: 120,
      },
      {
        itemId: 'item2',
        name: 'Paneer Butter Masala',
        shortName: 'PBM',
        quantity: 1,
        price: 150,
      },
      {
        itemId: 'item3',
        name: 'Gulab Jamun',
        shortName: 'GJ',
        quantity: 3,
        price: 30,
      },
    ],
    status: 'Completed',
    total: 480, // 2*120 + 1*150 + 3*30
    phoneNumber: '9876543210',
    createdBy: 'admin',
    createdAt: new Date(),
  };

  // Format date for receipt
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Format time for receipt
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="mb-6 iskcon-shadow">
      <CardContent className="p-0">
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Receipt Preview</h3>
            <p className="text-sm text-gray-500">This is how your receipt will look</p>
          </div>

          {/* Receipt preview */}
          <div className="p-4 font-mono text-sm bg-white" style={{ maxWidth: '350px', margin: '0 auto' }}>
            <div className="receipt-preview" style={{
              border: '1px dashed #ccc',
              padding: '1rem',
              backgroundColor: '#fff',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              lineHeight: '1.2',
              whiteSpace: 'pre-wrap',
              width: '100%',
              maxWidth: '300px',
              margin: '0 auto'
            }}>
              {/* Header */}
              <div className="text-center font-bold" style={{ fontSize: '1rem' }}>
                {config.headerText}
              </div>

              <div className="my-2 border-t border-b border-gray-300 py-1">
                <div className="flex justify-between">
                  <span>Order #:</span>
                  <span>{sampleOrder.id.substring(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{formatDate(sampleOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>{formatTime(sampleOrder.createdAt)}</span>
                </div>
                {sampleOrder.phoneNumber && (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{sampleOrder.phoneNumber}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="my-2">
                <div className="font-bold">Items:</div>
                {sampleOrder.items.map((item, index) => (
                  <div key={index} className="ml-2">
                    <div className="flex justify-between">
                      <span>{item.quantity} x {item.name}</span>
                      <span>Rs.{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="text-xs ml-4">
                      @ Rs.{item.price.toFixed(2)} each
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="my-2 border-t border-gray-300 pt-1">
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>Rs.{sampleOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 text-center">
                {config.footerText}
              </div>

              {/* QR Code placeholder */}
              {config.showQRCode && (
                <div className="mt-2 text-center">
                  <div style={{
                    border: '1px solid #ccc',
                    width: '80px',
                    height: '80px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem'
                  }}>
                    [QR Code]
                  </div>
                  <div className="text-xs mt-1">
                    Scan to {config.qrCodeData?.includes('http') ? 'visit' : 'view'}:
                    {config.qrCodeData?.substring(0, 20)}
                    {config.qrCodeData && config.qrCodeData.length > 20 ? '...' : ''}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
