export interface ReceiptConfig {
  id?: string;
  headerText: string;
  footerText: string;
  showQRCode: boolean;
  qrCodeData?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_RECEIPT_CONFIG: ReceiptConfig = {
  headerText: 'ISKCON Asansol Rath Yatra',
  footerText: 'Thank you for your support!',
  showQRCode: false,
};
