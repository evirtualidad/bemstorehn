
'use server';
/**
 * @fileOverview A flow for creating an order and saving it to the system.
 *
 * - createOrder - A function that handles the order creation process.
 */

import { ai } from '@/ai/genkit';
import { CreateOrderInputSchema, CreateOrderOutputSchema, type CreateOrderOutput } from '@/ai/schemas';
import type { NewOrderData, Order } from '@/hooks/use-orders';
import { initialOrders } from '@/lib/orders';
import { v4 as uuidv4 } from 'uuid';

const generateDisplayId = () => `BEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;


const createOrderFlow = ai.defineFlow(
  {
    name: 'createOrderFlow',
    inputSchema: CreateOrderInputSchema,
    outputSchema: CreateOrderOutputSchema,
  },
  async (input: NewOrderData) => {
    
    console.log("SIMULATION: createOrderFlow invoked with input:", JSON.stringify(input, null, 2));

    const newOrder: Order = {
      ...input,
      id: uuidv4(),
      display_id: generateDisplayId(),
      created_at: new Date().toISOString(),
    };
    
    // Simulate saving to the database by adding it to our initial mock data array.
    // In a real app, this would be a database insert operation.
    initialOrders.unshift(newOrder);
    
    console.log(`SIMULATION: Order with Display ID ${newOrder.display_id} created successfully.`);
    
    return {
      orderId: newOrder.id, // Return the actual UUID of the newly created order
      success: true,
    };
  }
);


export async function createOrder(input: NewOrderData): Promise<CreateOrderOutput> {
  return createOrderFlow(input);
}
