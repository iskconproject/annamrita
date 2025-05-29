export type PrintWidth = '58mm' | '80mm';

export interface PrintWidthConfig {
  width: PrintWidth;
  thermalWidth: number; // Character width for thermal printer
  cssWidth: string; // CSS width for preview/fallback printing
  pageSize: string; // CSS page size for @page rule
}

export const PRINT_WIDTH_CONFIGS: Record<PrintWidth, PrintWidthConfig> = {
  '58mm': {
    width: '58mm',
    thermalWidth: 32,
    cssWidth: '220px',
    pageSize: '58mm 297mm'
  },
  '80mm': {
    width: '80mm',
    thermalWidth: 48,
    cssWidth: '300px',
    pageSize: '80mm 297mm'
  }
};

export interface ReceiptConfig {
  id?: string;
  headerText: string;
  footerText: string;
  showQRCode: boolean;
  qrCodeData?: string;
  printWidth: PrintWidth;
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_RECEIPT_CONFIG: ReceiptConfig = {
  headerText: 'ISKCON Asansol Rath Yatra',
  footerText: 'Thank you for your support!',
  showQRCode: false,
  printWidth: '58mm',
};
