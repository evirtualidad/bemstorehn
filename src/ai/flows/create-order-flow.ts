
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
    
    console.log("createOrderFlow invoked to save order:", JSON.stringify(orderToSave.display_id, null, 2));

    try {
      const { error } = await supabase.from('orders').insert(orderToSave);

      if (error) {
        console.error('Error inserting order into Supabase:', error);
        // We throw the error so the calling `catch` block can log it,
        // but the client won't be waiting for this response.
        throw new Error(`Failed to save order: ${error.message}`);
      }
      
      console.log(`Order ${orderToSave.display_id} saved successfully to Supabase.`);
      
      return {
        orderId: orderToSave.id,
        success: true,
      };
    } catch (e: any) {
        console.error("[CRITICAL] Supabase insert failed in background:", e.message);
         return {
            orderId: orderToSave.id,
            success: false,
        };
    }
  }
);


export async function createOrder(input: Order): Promise<CreateOrderOutput> {
  return createOrderFlow(input);
}
