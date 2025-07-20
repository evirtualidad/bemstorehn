
import { z } from 'zod';
import type { NewOrderData } from '@/hooks/use-orders';

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
});

export const AddressSchema = z.object({
  department: z.string(),
  municipality: z.string(),
  colony: z.string().optional(),
  exactAddress: z.string(),
});

export const CreateOrderInputSchema = z.object({
  user_id: z.string().nullable(),
  customer_id: z.string().nullable(),
  customer_name: z.string(),
  customer_phone: z.string(),
  customer_address: AddressSchema.nullable(),
  items: z.array(ProductSchema),
  total: z.number(),
  shipping_cost: z.number(),
  payment_method: z.enum(['efectivo', 'tarjeta', 'transferencia', 'credito']),
  payment_reference: z.string().nullable(),
  delivery_method: z.enum(['pickup', 'delivery']).nullable(),
  status: z.enum(['pending-approval', 'pending-payment', 'paid', 'cancelled']),
  source: z.enum(['pos', 'online-store']),
  balance: z.number(),
  payments: z.array(z.any()), // Simplified for now
  payment_due_date: z.string().nullable(),
}) as z.ZodType<NewOrderData>;


export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export const CreateOrderOutputSchema = z.object({
  orderId: z.string(),
  success: z.boolean(),
});

export type CreateOrderOutput = z.infer<typeof CreateOrderOutputSchema>;
