
'use server';
/**
 * @fileOverview A flow for creating an order and saving it to the system.
 *
 * - createOrder - A function that handles the order creation process.
 */

import { ai } from '@/ai/genkit';
import { CreateOrderInputSchema, CreateOrderOutputSchema, type CreateOrderOutput } from '@/ai/schemas';
import type { Order } from '@/hooks/use-orders';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';


// The flow now accepts the full Order object, as it's created on the client first.
const FullOrderSchema = CreateOrderInputSchema.extend({
    id: z.string(),
    display_id: z.string(),
    created_at: z.string(),
});

const createOrderFlow = ai.defineFlow(
  {
    name: 'createOrderFlow',
    inputSchema: FullOrderSchema,
    outputSchema: CreateOrderOutputSchema,
  },
  async (orderToSave: Order) => {
    
    console.log(`[Flow] Attempting to save order to Supabase: ${orderToSave.display_id}`);

    try {
      // Directly insert the provided order object into the Supabase table.
      const { error } = await supabase.from('orders').insert(orderToSave);

      if (error) {
        // This error will be logged on the server but won't crash the client.
        console.error(`[CRITICAL] Supabase insert failed for order ${orderToSave.display_id}:`, error.message);
        throw new Error(`Failed to save order to Supabase: ${error.message}`);
      }
      
      console.log(`[Flow] Order ${orderToSave.display_id} saved successfully to Supabase.`);
      
      // Return a success response with the order ID.
      return {
        orderId: orderToSave.id,
        success: true,
      };

    } catch (e: any) {
       console.error(`[CRITICAL] An unexpected error occurred in createOrderFlow for order ${orderToSave.display_id}:`, e.message);
       // We must re-throw or handle it so the flow doesn't hang, but the client won't see this.
       // The flow will report failure, but the client has already moved on.
       return {
        orderId: orderToSave.id,
        success: false,
       }
    }
  }
);


export async function createOrder(input: Order): Promise<CreateOrderOutput> {
  return createOrderFlow(input);
}
