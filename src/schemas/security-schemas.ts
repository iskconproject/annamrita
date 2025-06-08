import { z } from "zod";

// Enhanced user schema with security validations
export const userSchema = z.object({
  name: z.string()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must not exceed 100 characters" })
    .regex(/^[a-zA-Z\s\-'.,]+$/, { message: "Name contains invalid characters" }),
  email: z.string()
    .email("Invalid email address")
    .max(255, { message: "Email must not exceed 255 characters" })
    .toLowerCase(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    })
    .optional(),
  role: z.enum(["admin", "volunteer", "kitchen"] as const),
});

// Login schema
export const loginSchema = z.object({
  email: z.string()
    .email("Invalid email address")
    .max(255, { message: "Email must not exceed 255 characters" })
    .toLowerCase(),
  password: z.string()
    .min(1, "Password is required")
    .max(128, "Password must not exceed 128 characters"),
});

// Order schema with security validations
export const orderSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1, "Item ID is required"),
    name: z.string()
      .min(1, "Item name is required")
      .max(100, "Item name must not exceed 100 characters"),
    price: z.number()
      .min(0, "Price must be positive")
      .max(10000, "Price must not exceed ₹10,000"),
    quantity: z.number()
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1")
      .max(100, "Quantity must not exceed 100"),
    category: z.string()
      .min(1, "Category is required")
      .max(50, "Category must not exceed 50 characters")
      .regex(/^[a-zA-Z0-9\s\-'&().,]+$/, "Category contains invalid characters"),
  })).min(1, "At least one item is required"),
  total: z.number()
    .min(0, "Total must be positive")
    .max(100000, "Total must not exceed ₹1,00,000"),
  phoneNumber: z.string()
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number format")
    .max(20, "Phone number must not exceed 20 characters")
    .optional()
    .or(z.literal("")),
});

// Receipt configuration schema
export const receiptConfigSchema = z.object({
  businessName: z.string()
    .min(1, "Business name is required")
    .max(100, "Business name must not exceed 100 characters")
    .regex(/^[a-zA-Z0-9\s\-'&().,]+$/, "Business name contains invalid characters"),
  address: z.string()
    .max(500, "Address must not exceed 500 characters")
    .optional(),
  phone: z.string()
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number format")
    .max(20, "Phone number must not exceed 20 characters")
    .optional(),
  email: z.string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters")
    .optional(),
  footerMessage: z.string()
    .max(200, "Footer message must not exceed 200 characters")
    .optional(),
  printWidth: z.enum(["58mm", "80mm"] as const),
  showLogo: z.boolean().default(false),
  showQR: z.boolean().default(false),
});

// Search/filter schema
export const searchSchema = z.object({
  query: z.string()
    .max(100, "Search query must not exceed 100 characters")
    .regex(/^[a-zA-Z0-9\s\-'&().,]*$/, "Search query contains invalid characters")
    .optional(),
  category: z.string()
    .max(50, "Category must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s\-'&().,]*$/, "Category contains invalid characters")
    .optional(),
  sortBy: z.enum(["name", "price", "category", "createdAt"] as const).optional(),
  sortOrder: z.enum(["asc", "desc"] as const).optional(),
  limit: z.number()
    .int("Limit must be a whole number")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .optional(),
  offset: z.number()
    .int("Offset must be a whole number")
    .min(0, "Offset must be non-negative")
    .optional(),
});

// Audit log schema
export const auditLogSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  action: z.string()
    .min(1, "Action is required")
    .max(100, "Action must not exceed 100 characters")
    .regex(/^[a-zA-Z0-9_\-:]+$/, "Action contains invalid characters"),
  resource: z.string()
    .min(1, "Resource is required")
    .max(100, "Resource must not exceed 100 characters"),
  success: z.boolean(),
  details: z.record(z.any()).optional(),
  ipAddress: z.string()
    .regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, "Invalid IP address")
    .optional(),
  userAgent: z.string()
    .max(500, "User agent must not exceed 500 characters")
    .optional(),
});

// File upload schema
export const fileUploadSchema = z.object({
  fileName: z.string()
    .min(1, "File name is required")
    .max(255, "File name must not exceed 255 characters")
    .regex(/^[a-zA-Z0-9\s\-_.,()]+\.[a-zA-Z0-9]+$/, "Invalid file name format"),
  fileSize: z.number()
    .int("File size must be a whole number")
    .min(1, "File size must be positive")
    .max(10 * 1024 * 1024, "File size must not exceed 10MB"), // 10MB limit
  mimeType: z.string()
    .regex(/^[a-zA-Z0-9\-]+\/[a-zA-Z0-9\-+.]+$/, "Invalid MIME type"),
});

// Settings schema
export const settingsSchema = z.object({
  theme: z.enum(["light", "dark"] as const).optional(),
  language: z.enum(["en", "hi", "bn"] as const).optional(),
  timezone: z.string()
    .max(50, "Timezone must not exceed 50 characters")
    .optional(),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
  }).optional(),
  privacy: z.object({
    shareAnalytics: z.boolean().default(false),
    allowCookies: z.boolean().default(true),
  }).optional(),
});

// Export all schema types
export type UserFormValues = z.infer<typeof userSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type OrderFormValues = z.infer<typeof orderSchema>;
export type ReceiptConfigFormValues = z.infer<typeof receiptConfigSchema>;
export type SearchFormValues = z.infer<typeof searchSchema>;
export type AuditLogFormValues = z.infer<typeof auditLogSchema>;
export type FileUploadFormValues = z.infer<typeof fileUploadSchema>;
export type SettingsFormValues = z.infer<typeof settingsSchema>;

// Validation helper functions
export const validateUserInput = (data: unknown) => userSchema.parse(data);
export const validateLoginInput = (data: unknown) => loginSchema.parse(data);
export const validateOrderInput = (data: unknown) => orderSchema.parse(data);
export const validateReceiptConfigInput = (data: unknown) => receiptConfigSchema.parse(data);
export const validateSearchInput = (data: unknown) => searchSchema.parse(data);
export const validateAuditLogInput = (data: unknown) => auditLogSchema.parse(data);
export const validateFileUploadInput = (data: unknown) => fileUploadSchema.parse(data);
export const validateSettingsInput = (data: unknown) => settingsSchema.parse(data);

// Safe parsing functions that return validation results
export const safeValidateUserInput = (data: unknown) => userSchema.safeParse(data);
export const safeValidateLoginInput = (data: unknown) => loginSchema.safeParse(data);
export const safeValidateOrderInput = (data: unknown) => orderSchema.safeParse(data);
export const safeValidateReceiptConfigInput = (data: unknown) => receiptConfigSchema.safeParse(data);
export const safeValidateSearchInput = (data: unknown) => searchSchema.safeParse(data);
export const safeValidateAuditLogInput = (data: unknown) => auditLogSchema.safeParse(data);
export const safeValidateFileUploadInput = (data: unknown) => fileUploadSchema.safeParse(data);
export const safeValidateSettingsInput = (data: unknown) => settingsSchema.safeParse(data);
