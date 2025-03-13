import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial();

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Seller schemas
export const createSellerSchema = z.object({
  userId: z.string().min(1, { message: "UserId is required" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" })
});

export type CreateSellerInput = z.infer<typeof createSellerSchema>;

export const updateSellerSchema = z.object({
  address: z.string().min(5, { message: "Address must be at least 5 characters" }).optional(),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }).optional()
});

export type UpdateSellerInput = z.infer<typeof updateSellerSchema>;

// Product update schema
export const updateProductSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }).optional(),
  price: z.number().positive({ message: "Price must be positive" }).optional(),
  stockQuantity: z.number().int().nonnegative({ message: "Stock quantity must be non-negative" }).optional(),
  image: z.array(z.string()).optional(),
  category: z.enum(['men', 'women', 'kids']).optional(),
  subCategory: z.enum(['topwear', 'bottomwear', 'winterwear']).optional(),
  size: z.array(z.enum(['S', 'M', 'L', 'XL', 'XXL'])).optional()
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
