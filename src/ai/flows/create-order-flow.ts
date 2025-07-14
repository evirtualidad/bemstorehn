
'use server';
/**
 * @fileOverview A flow for creating an order.
 *
 * - createOrder - A function that handles the order creation process.
 * - CreateOrderInput - The input type for the createOrder function.
 * - CreateOrderOutput - The return type for the createOrder function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
});

const CreateOrderInputSchema = z.object({
  customer: z.object({
    name: z.string(),
    phone: z.string(),
  }),
  items: z.array(ProductSchema),
  total: z.number(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

const CreateOrderOutputSchema = z.object({
  orderId: z.string(),
  success: z.boolean(),
});

export type CreateOrderOutput = z.infer<typeof CreateOrderOutputSchema>;

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderOutput> {
  return createOrderFlow(input);
}

const createOrderFlow = ai.defineFlow(
  {
    name: 'createOrderFlow',
    inputSchema: CreateOrderInputSchema,
    outputSchema: CreateOrderOutputSchema,
  },
  async (input) => {
    console.log('Creating order with input:', JSON.stringify(input, null, 2));

    // In a real application, you would save the order to Firestore here.
    // For now, we'll just simulate it.
    const orderId = `ord_${new Date().getTime()}`;

    console.log(`Order ${orderId} created successfully.`);

    // And you would also decrease the stock for each product.

    return {
      orderId,
      success: true,
    };
  }
);
