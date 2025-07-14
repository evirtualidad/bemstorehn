
'use server';
/**
 * @fileOverview A flow for creating an order and saving it to Firestore.
 *
 * - createOrder - A function that handles the order creation process.
 * - CreateOrderInput - The input type for the createOrder function.
 * - CreateOrderOutput - The return type for the createOrder function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';

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

const createOrderFlow = ai.defineFlow(
  {
    name: 'createOrderFlow',
    inputSchema: CreateOrderInputSchema,
    outputSchema: CreateOrderOutputSchema,
  },
  async (input) => {
    try {
      const db = getFirestore(app);
      const ordersCollection = collection(db, 'orders');

      // Prepare items for Firestore, removing unnecessary fields if any
      const itemsForDb = input.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const docRef = await addDoc(ordersCollection, {
        customer: input.customer,
        items: itemsForDb,
        total: input.total,
        createdAt: serverTimestamp(),
        status: 'pending', // Initial status
      });

      console.log(`Order ${docRef.id} created successfully in Firestore.`);

      // In a real application, you would also decrease the stock for each product here.
      // We will tackle this in a future step.

      return {
        orderId: docRef.id,
        success: true,
      };
    } catch (error) {
      console.error("Error creating order in Firestore:", error);
      return {
        orderId: '',
        success: false,
      };
    }
  }
);
