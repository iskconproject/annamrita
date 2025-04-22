import { z } from "zod";

export const menuItemSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  shortName: z.string().min(1, { message: "Short name is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number" }),
  available: z.boolean().default(true),
});

export type MenuItemFormValues = z.infer<typeof menuItemSchema>;
