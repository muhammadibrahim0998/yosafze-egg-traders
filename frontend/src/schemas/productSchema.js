import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  category: z.string().optional().or(z.literal('')),
  price: z.coerce.number().min(0, { message: "Price cannot be negative" }),
  costPrice: z.coerce.number().optional(),
  stock: z.coerce.number().optional(),
  minStock: z.coerce.number().optional(),
  description: z.string().optional().or(z.literal('')),
  images: z.array(z.string()).optional(),
  mfgDate: z.any().optional(),
  expiryDate: z.any().optional(),
});
