// Type definitions for WebUSB API
interface Navigator {
  usb: {
    requestDevice(options: { filters: Array<{ vendorId: number }> }): Promise<USBDevice>;
  };
}

interface USBDevice {
  open(): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
  close(): Promise<void>;
}

interface USBOutTransferResult {
  bytesWritten: number;
  status: string;
}
