
'use server';
/**
 * @fileOverview A flow for creating an order and saving it locally (simulated).
 *
 * - createOrder - A function that handles the order creation process.
 * - CreateOrderInput - The input type for the createOrder function.
 * - CreateOrderOutput - The return type for the createOrder function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { products as allProducts, Product } from '@/lib/products';

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  image: z.string(),
  category: z.string(),
  description: z.string(),
  stock: z.number(),
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

// This is a local, in-memory representation of our product stock.
// In a real application, this would be a database.
let localProductStock: Product[] = JSON.parse(JSON.stringify(allProducts));

const createOrderFlow = ai.defineFlow(
  {
    name: 'createOrderFlow',
    inputSchema: CreateOrderInputSchema,
    outputSchema: CreateOrderOutputSchema,
  },
  async (input) => {
    try {
      // Simulate creating an order by logging it to the console
      const orderId = `MOCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      console.log("--- MOCK ORDER CREATED ---");
      console.log("Order ID:", orderId);
      console.log("Customer:", input.customer);
      console.log("Items:", input.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })));
      console.log("Total:", input.total);
      
      // Simulate updating stock
      console.log("--- UPDATING STOCK ---");
      input.items.forEach(item => {
        const productInDb = localProductStock.find(p => p.id === item.id);
        if (productInDb) {
          const oldStock = productInDb.stock;
          productInDb.stock -= item.quantity;
          console.log(`Product: ${productInDb.name}, Old Stock: ${oldStock}, New Stock: ${productInDb.stock}`);
        }
      });
      console.log("--------------------------");

      return {
        orderId: orderId,
        success: true,
      };
    } catch (error) {
      console.error("Error creating mock order:", error);
      return {
        orderId: '',
        success: false,
      };
    }
  }
);
