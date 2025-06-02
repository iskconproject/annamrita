import { z } from "zod";

// Enhanced menu item schema with security validations
export const menuItemSchema = z.object({
  name: z.string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must not exceed 100 characters" })
    .regex(/^[a-zA-Z0-9\s\-'&().,]+$/, { message: "Name contains invalid characters" }),
  shortName: z.string()
    .min(1, { message: "Short name is required" })
    .max(20, { message: "Short name must not exceed 20 characters" })
    .regex(/^[a-zA-Z0-9\s\-'&().,]+$/, { message: "Short name contains invalid characters" }),
  category: z.string()
    .min(1, { message: "Category is required" })
    .max(50, { message: "Category must not exceed 50 characters" })
    .regex(/^[a-zA-Z0-9\s\-'&().,]+$/, { message: "Category contains invalid characters" }),
  price: z.coerce.number()
    .min(0, { message: "Price must be a positive number" })
    .max(10000, { message: "Price must not exceed ₹10,000" })
    .multipleOf(0.01, { message: "Price must be a valid currency amount" }),
  available: z.boolean().default(true),
});

// Category schema
export const categorySchema = z.object({
  name: z.string()
    .min(1, { message: "Category name is required" })
    .max(50, { message: "Category name must not exceed 50 characters" })
    .regex(/^[a-zA-Z0-9\s\-'&().,]+$/, { message: "Category name contains invalid characters" }),
});

export type MenuItemFormValues = z.infer<typeof menuItemSchema>;
export type CategoryFormValues = z.infer<typeof categorySchema>;
