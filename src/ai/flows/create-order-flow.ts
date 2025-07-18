
'use server';
/**
 * @fileOverview A flow for creating an order and saving it to the system.
 *
 * - createOrder - A function that handles the order creation process.
 */

import { ai } from '@/ai/genkit';
import { CreateOrderInputSchema, CreateOrderOutputSchema, type CreateOrderInput, type CreateOrderOutput } from '@/ai/schemas';

const createOrderFlow = ai.defineFlow(
  {
    name: 'createOrderFlow',
    inputSchema: CreateOrderInputSchema,
    outputSchema: CreateOrderOutputSchema,
  },
  async (input) => {
    
    console.log("SIMULATION: createOrderFlow invoked with input:", JSON.stringify(input, null, 2));

    // Simulate network delay and processing
    await new Promise(res => setTimeout(res, 1000));

    // In a real scenario, this is where you'd interact with a database (Firebase, Supabase, etc.)
    // For now, we'll just simulate a successful creation and return a mock order ID.
    
    try {
      const displayId = `MOCK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      console.log(`SIMULATION: Order with Display ID ${displayId} created successfully.`);
      
      return {
        orderId: displayId,
        success: true,
      };
    } catch (error: any) {
      console.error("[createOrderFlow SIMULATION Error]", error);
      // Re-throw the error so it can be caught by the client-side caller
      throw error;
    }
  }
);


export async function createOrder(input: CreateOrderInput): Promise<CreateOrderOutput> {
  return createOrderFlow(input);
}
