'use server';
/**
 * @fileOverview A server-side flow to securely create an online order.
 * This flow handles customer creation/lookup, stock validation, and order insertion
 * with elevated privileges to bypass RLS policies for anonymous users.
 *
 * - createOnlineOrder: The main function to call from the client.
 */
import { ai } from '@/ai/genkit';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { CreateOrderInputSchema } from '../schemas';
import type { Order } from '@/lib/types';


const CreateOrderOutputSchema = z.object({
    order: z.any().optional(), // We'll pass the full order object back
    success: z.boolean(),
    error: z.string().optional(),
});

// Extend the input schema to include Supabase credentials
const FlowInputSchema = CreateOrderInputSchema.extend({
    supabaseUrl: z.string(),
    supabaseServiceKey: z.string(),
});

// This flow is defined to run on the server and is not directly exposed to the client.
const createOrderFlow = ai.defineFlow(
  {
    name: 'createOrderFlow',
    inputSchema: FlowInputSchema,
    outputSchema: CreateOrderOutputSchema,
  },
  async (flowInput) => {
    // Destructure credentials and order data from the new input schema
    const { supabaseUrl, supabaseServiceKey, ...orderData } = flowInput;
    
    // Create the admin client using the passed-in credentials
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
        const { customer_name, customer_phone, customer_address, items, total } = orderData;
        
        // --- 1. Create or find the customer ---
        let customerId;
        if (customer_phone) {
            const { data: existingCustomer } = await supabaseAdmin
                .from('customers')
                .select('id')
                .eq('phone', customer_phone)
                .single();
            if (existingCustomer) customerId = existingCustomer.id;
        }

        if (!customerId) {
            const { data: newCustomer, error: createCustomerError } = await supabaseAdmin
                .from('customers')
                .insert({ name: customer_name, phone: customer_phone, address: customer_address })
                .select('id')
                .single();
            if (createCustomerError) throw new Error(`Error creating customer: ${createCustomerError.message}`);
            customerId = newCustomer!.id;
        }

        // --- 2. Verify stock and update it ---
        for (const item of items) {
            const { data: product, error: productError } = await supabaseAdmin
                .from('products')
                .select('stock, name')
                .eq('id', item.id)
                .single();
            
            if (productError) throw new Error(`Error fetching product ${item.name}: ${productError.message}`);
            if (!product || product.stock < item.quantity) {
                throw new Error(`Insufficient stock for: ${item.name}.`);
            }

            const newStock = product.stock - item.quantity;
            const { error: stockUpdateError } = await supabaseAdmin
                .from('products')
                .update({ stock: newStock })
                .eq('id', item.id);
            if (stockUpdateError) throw new Error(`Error updating stock for ${item.name}: ${stockUpdateError.message}`);
        }
        
        // --- 3. Create the order ---
        const { data: lastOrder, error: lastOrderError } = await supabaseAdmin
          .from('orders')
          .select('display_id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let nextId = 1;
        if (lastOrder && !lastOrderError) {
            nextId = parseInt(lastOrder.display_id.split('-')[1]) + 1;
        }
        
        const display_id = `ORD-${String(nextId).padStart(5, '0')}`;

        const finalOrderData = {
            ...orderData,
            display_id,
            customer_id: customerId,
            status: 'pending-approval',
            balance: total,
            payments: [],
            payment_due_date: null,
        };
        
        const { data: newOrder, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert(finalOrderData)
            .select('*') // <<<--- CHANGE: Fetch the full order object
            .single();
            
        if (orderError) throw new Error(`Error creating order: ${orderError.message}`);

        // --- 4. Update customer stats ---
        await supabaseAdmin.rpc('increment_customer_stats', {
            p_customer_id: customerId,
            p_purchase_amount: total
        });

        return { success: true, order: newOrder };

    } catch (error: any) {
        console.error('Error in createOrderFlow:', error);
        return { success: false, error: error.message };
    }
  }
);

// This is the exported function that the client-side code will call.
// It will now read the environment variables and pass them to the flow.
export async function createOnlineOrder(input: z.infer<typeof CreateOrderInputSchema>): Promise<{order: Order, success: boolean, error?: string} | null> {
    const result = await createOrderFlow({
        ...input,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY!,
    });
    if(result.success) {
        return { order: result.order, success: true };
    }
    return { order: null as any, success: false, error: result.error };
}
