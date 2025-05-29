# Printer Settings Update - 3-inch Print Width Support & Database Persistence

## Overview
This update adds support for 3-inch (80mm) print width in addition to the existing 2-inch (58mm) width, and ensures that all receipt configuration settings are properly persisted to the Appwrite database.

## Changes Made

### 1. Updated Receipt Configuration Types (`src/types/receipt.ts`)
- Added `PrintWidth` type with support for '58mm' and '80mm'
- Added `PrintWidthConfig` interface to define width-specific settings
- Added `PRINT_WIDTH_CONFIGS` constant with configuration for both widths:
  - **58mm (2-inch)**: 32 character width, 220px CSS width, 58mm page size
  - **80mm (3-inch)**: 48 character width, 300px CSS width, 80mm page size
- Updated `ReceiptConfig` interface to include `printWidth` field
- Updated `DEFAULT_RECEIPT_CONFIG` to default to '58mm'

### 2. Enhanced Print Service (`src/services/printService.tsx`)
- Updated `generateReceiptJSX()` to use dynamic print width from configuration
- Updated `printReceiptFallback()` to use dynamic CSS width and page size
- Removed hardcoded width values (previously fixed at 32 characters/220px)
- Both thermal printing and fallback printing now respect the selected print width

### 3. Updated Receipt Configuration Form (`src/components/receipts/ReceiptConfigForm.tsx`)
- Added print width selection dropdown with options:
  - "58mm (2 inch) - Standard"
  - "80mm (3 inch) - Wide"
- Added proper form handling for the new select field
- Integrated with real-time preview updates

### 4. Enhanced Receipt Preview (`src/components/receipts/ReceiptPreview.tsx`)
- Updated preview to dynamically adjust width based on selected print width
- Added print width indicator in preview header
- Preview now accurately represents how receipts will look for each width

### 5. Updated Receipt Configuration Store (`src/store/receiptConfigStore.ts`)
- Added handling for `printWidth` field in database operations
- Ensures backward compatibility with existing configurations (defaults to '58mm')
- Proper persistence of print width settings to Appwrite database

### 6. Database Schema Update
- Added `printWidth` enum attribute to the `receipt-config` collection in Appwrite
- Attribute accepts values: ["58mm", "80mm"]
- Updated existing receipt configuration document to include default print width

## Technical Details

### Print Width Configurations
```typescript
'58mm': {
  width: '58mm',
  thermalWidth: 32,     // Characters per line for thermal printer
  cssWidth: '220px',    // CSS width for preview/fallback
  pageSize: '58mm 297mm' // CSS page size for printing
},
'80mm': {
  width: '80mm',
  thermalWidth: 48,     // Characters per line for thermal printer
  cssWidth: '300px',    // CSS width for preview/fallback
  pageSize: '80mm 297mm' // CSS page size for printing
}
```

### Database Persistence
- All receipt configuration changes are automatically saved to Appwrite database
- The `printWidth` field is now part of the persisted configuration
- Existing configurations are automatically migrated to include the default '58mm' width

## Benefits

1. **Flexible Printer Support**: Now supports both standard 2-inch and wide 3-inch thermal printers
2. **Persistent Configuration**: All settings including print width are saved to database
3. **Real-time Preview**: Users can see exactly how receipts will look with different widths
4. **Backward Compatibility**: Existing configurations continue to work with default 58mm width
5. **Consistent Formatting**: Both thermal and fallback printing respect the selected width

## Usage

1. Navigate to Settings → Receipt Configuration
2. Select desired print width from the dropdown (58mm or 80mm)
3. Configure other receipt settings as needed
4. Preview shows real-time changes including width adjustments
5. Save configuration to persist all settings to database
6. All future receipts will use the selected print width

## Testing

The implementation has been tested to ensure:
- ✅ Print width selection works correctly in the UI
- ✅ Preview accurately reflects selected width
- ✅ Configuration persists to Appwrite database
- ✅ Thermal printing uses correct character width
- ✅ Fallback printing uses correct CSS dimensions
- ✅ Backward compatibility with existing configurations
- ✅ No TypeScript compilation errors
- ✅ Application runs without runtime errors

## Files Modified

1. `src/types/receipt.ts` - Added print width types and configurations
2. `src/services/printService.tsx` - Dynamic width support in printing
3. `src/components/receipts/ReceiptConfigForm.tsx` - Print width selection UI
4. `src/components/receipts/ReceiptPreview.tsx` - Dynamic preview width
5. `src/store/receiptConfigStore.ts` - Database persistence for print width
6. Appwrite database - Added `printWidth` enum attribute to receipt-config collection

The printer settings now fully support both 2-inch and 3-inch print widths with proper database persistence, providing a complete and flexible receipt printing solution.
