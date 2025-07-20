
'use server';
/**
 * @fileOverview A flow for creating an order and saving it to the system.
 *
 * - createOrder - A function that handles the order creation process.
 */

import { ai } from '@/ai/genkit';
import { CreateOrderInputSchema, CreateOrderOutputSchema, type CreateOrderOutput } from '@/ai/schemas';
import type { NewOrderData, Order } from '@/hooks/use-orders';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const generateDisplayId = () => `BEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;


const createOrderFlow = ai.defineFlow(
  {
    name: 'createOrderFlow',
    inputSchema: CreateOrderInputSchema,
    outputSchema: CreateOrderOutputSchema,
  },
  async (input: NewOrderData) => {
    
    console.log("createOrderFlow invoked with input:", JSON.stringify(input, null, 2));

    const newOrder: Order = {
      ...input,
      id: uuidv4(),
      display_id: generateDisplayId(),
      created_at: new Date().toISOString(),
    };
    
    const { error } = await supabase.from('orders').insert(newOrder);

    if (error) {
      console.error('Error inserting order into Supabase:', error);
      throw new Error(`Failed to save order: ${error.message}`);
    }
    
    console.log(`Order with Display ID ${newOrder.display_id} created successfully in Supabase.`);
    
    return {
      orderId: newOrder.id,
      success: true,
    };
  }
);


export async function createOrder(input: NewOrderData): Promise<CreateOrderOutput> {
  return createOrderFlow(input);
}
