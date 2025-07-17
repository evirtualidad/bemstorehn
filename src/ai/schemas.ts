
import { z } from 'zod';

/**
 * @fileOverview This file contains the Zod schemas for the application's AI flows.
 * Separating schemas into their own file is crucial for Next.js Server Actions,
 * as files marked with "use server" cannot export non-function objects like Zod schemas.
 * 
 * - ProductSchema: Defines the structure for a product.
 * - AddressSchema: Defines the structure for a shipping/billing address.
 * - CreateOrderInputSchema: Defines the input for the order creation flow.
 * - CreateOrderOutputSchema: Defines the output for the order creation flow.
 */

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  image: z.string(),
  category: z.string(),
  description: z.string(),
  stock: z.number(),
});

export const AddressSchema = z.object({
  department: z.string(),
  municipality: z.string(),
  colony: z.string().optional(),
  exactAddress: z.string(),
});

export const CreateOrderInputSchema = z.object({
  customer: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    address: AddressSchema.optional(),
  }),
  items: z.array(ProductSchema),
  total: z.number(),
  shippingCost: z.number().optional(),
  paymentMethod: z.enum(['efectivo', 'tarjeta', 'transferencia', 'credito']),
  deliveryMethod: z.enum(['pickup', 'delivery']).optional(),
  paymentDueDate: z.string().optional(),
  cashAmount: z.number().optional(),
  paymentReference: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export const CreateOrderOutputSchema = z.object({
  orderId: z.string(),
  success: z.boolean(),
});

export type CreateOrderOutput = z.infer<typeof CreateOrderOutputSchema>;
