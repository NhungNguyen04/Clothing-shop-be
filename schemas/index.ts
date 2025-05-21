import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const createOAuthSchema = createUserSchema.omit({ password: true });
export type CreateOAuthInput = z.infer<typeof createOAuthSchema>;

export const updateUserSchema = z.object ({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).optional(),
  email: z.string().email({ message: 'Invalid email format' }).optional(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).optional(),
  phoneNumber: z.string().optional(),
  image: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional()
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Seller schemas
export const createSellerSchema = z.object({
  userId: z.string().min(1, { message: 'User ID is required' }),

  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email format' }),

  address: z
    .string()
    .min(5, { message: 'Address must be at least 5 characters' }),

  phone: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 characters' })
    .regex(/^\d+$/, { message: 'Phone number must contain only digits' }),

  managerName: z
    .string()
    .min(3, { message: 'Manager Name must be at least 3 characters' }),

  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),

  postalCode: z
    .string()
    .min(5, { message: 'Postal Code must be at least 5 characters' })
    .regex(/^\d+$/, { message: 'Postal Code must contain only digits' }),
});

export type CreateSellerInput = z.infer<typeof createSellerSchema>;

export const updateSellerSchema = z.object({
  address: z
    .string()
    .min(5, { message: 'Address must be at least 5 characters' })
    .optional(),
  phone: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 characters' })
    .optional(),
});

export type UpdateSellerInput = z.infer<typeof updateSellerSchema>;

// Product update schema
export const createProductSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters' }),
  price: z.number().positive({ message: 'Price must be positive' }),
  image: z.array(z.string()),
  category: z.enum(['men', 'women', 'kids']),
  subCategory: z.enum(['topwear', 'bottomwear', 'winterwear']),
  sellerId: z.string().min(1, { message: 'SellerId is required' }),
  stockSize: z.array(
    z.object({
      size: z.enum(['S', 'M', 'L', 'XL', 'XXL']),
      quantity: z.number().int().nonnegative(),
    }),
  ),
});


// Schema for order item
const orderItemSchema = z.object({
  sizeStockId: z.string(),
  quantity: z.number().positive(),
  price: z.number().positive()
});

// Schema for creating an order
export const createOrderSchema = z.object({
  userId: z.string(),
  sellerId: z.string(),
  phoneNumber: z.string(),
  address: z.string(),
  postalCode: z.string().optional(),
  paymentMethod: z.enum(['COD', 'VIETQR']).default('COD'),
  orderItems: z.array(orderItemSchema)
});

export const cartToOrderSchema = z.object({
  cartId: z.string(),
  userId: z.string(),
  phoneNumber: z.string(),
  address: z.string(),
  postalCode: z.string().optional(),
  paymentMethod: z.enum(['COD', 'VIETQR']).default('COD'),
  selectedCartItemIds: z.array(z.string())
});

// Schema for updating an order
export const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'SUCCESS']).optional(),
  shipmentStatus: z.string().optional(),
  deliveryDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  cancelReason: z.string().optional()
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CartToOrderInput = z.infer<typeof cartToOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, { message: 'Rating must be between 1 and 5' }),
  comment: z.string().optional(),
  images: z.array(z.string()).optional(),
  reviewDate: z.date().default(new Date()),
  productId: z.string().min(1, { message: 'ProductId is required' }),
  userId: z.string().min(1, { message: 'UserId is required' }),
});

export const createShipmentSchema = z.object({
  status: z.string().min(1, { message: 'Status is required' }),
  deliveryDate: z.date().optional(),
  orderId: z.string().min(1, { message: 'OrderId is required' }),
});


export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;


export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = createReviewSchema.partial();

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;


export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

export const updateShipmentSchema = createShipmentSchema.partial();

export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;

