
'use server';
/**
 * @fileOverview A flow for creating an order and saving it to the system.
 *
 * - createOrder - A function that handles the order creation process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { Order, Address as OrderAddress } from '@/hooks/use-orders';
import { CreateOrderInputSchema, CreateOrderOutputSchema, type CreateOrderInput, type CreateOrderOutput } from '@/ai/schemas';

// Helper to add or update a customer
const addOrUpdateCustomer = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  customerData: { phone?: string; name?: string; address?: OrderAddress }, 
  totalToAdd: number
): Promise<string | null> => {
    if (!customerData.phone && !customerData.name) {
        return null;
    }

    const { data: existingCustomer, error: findError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone', customerData.phone)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST1116 is 'not found'
      console.error('Error finding customer:', findError);
      throw new Error(`No se pudo verificar el cliente: ${findError.message}`);
    }

    if (existingCustomer) {
      const { data: updatedCustomer, error: updateError } = await supabaseAdmin
        .from('customers')
        .update({
          name: customerData.name || existingCustomer.name,
          address: customerData.address || existingCustomer.address,
          total_spent: existingCustomer.total_spent + totalToAdd,
          order_count: existingCustomer.order_count + 1
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating customer:', updateError);
        throw new Error(`No se pudo actualizar el cliente: ${updateError.message}`);
      }
      return updatedCustomer.id;
    } else {
      const { data: newCustomer, error: insertError } = await supabaseAdmin
        .from('customers')
        .insert([{
          phone: customerData.phone,
          name: customerData.name,
          address: customerData.address || null,
          total_spent: totalToAdd,
          order_count: 1
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating customer:', insertError);
        throw new Error(`No se pudo crear el nuevo cliente: ${insertError.message}`);
      }
      return newCustomer.id;
    }
};


const createOrderFlow = ai.defineFlow(
  {
    name: 'createOrderFlow',
    inputSchema: CreateOrderInputSchema,
    outputSchema: CreateOrderOutputSchema,
  },
  async (input) => {
    
    // This initialization is CRITICAL for server-side flows.
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
            autoRefreshToken: false,
            persistSession: false
            }
        }
    );

    try {
      const customerId = await addOrUpdateCustomer(supabaseAdmin, {
        name: input.customer.name,
        phone: input.customer.phone,
        address: input.customer.address,
      }, input.total);
      
      const newOrderData: Omit<Order, 'id' | 'display_id' | 'created_at'> = {
        user_id: null, // From POS, no specific user
        customer_id: customerId,
        customer_name: input.customer.name || 'Consumidor Final',
        customer_phone: input.customer.phone || 'N/A',
        customer_address: input.customer.address as OrderAddress | null,
        items: input.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        total: input.total,
        shipping_cost: input.shippingCost || 0,
        payment_method: input.paymentMethod,
        payment_reference: input.paymentReference || null,
        status: input.paymentMethod === 'credito' ? 'pending-payment' : 'paid',
        source: 'pos',
        delivery_method: input.deliveryMethod || 'pickup',
        balance: input.paymentMethod === 'credito' ? input.total : 0,
        payments: input.paymentMethod !== 'credito' ? [{
            amount: input.total,
            method: input.paymentMethod,
            date: new Date().toISOString(),
            cash_received: input.cashAmount,
            change_given: input.cashAmount ? input.cashAmount - input.total : undefined,
        }] : [],
        payment_due_date: input.paymentDueDate || null,
      };

       const { data, error } = await supabaseAdmin
        .from('orders')
        .insert([newOrderData])
        .select()
        .single();
        
      if (error) {
        // This will now throw the actual DB error
        throw new Error(`Error al crear pedido en DB: ${error.message}`);
      }

      const newOrder = data as Order;
      
      return {
        orderId: newOrder.display_id,
        success: true,
      };
    } catch (error: any) {
      console.error("[createOrderFlow Error]", error);
      // Re-throw the error so it can be caught by the client-side caller
      throw error;
    }
  }
);


export async function createOrder(input: CreateOrderInput): Promise<CreateOrderOutput> {
  return createOrderFlow(input);
}
