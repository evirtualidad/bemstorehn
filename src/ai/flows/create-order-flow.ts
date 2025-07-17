
'use server';
/**
 * @fileOverview A flow for creating an order and saving it to the system.
 *
 * - createOrder - A function that handles the order creation process.
 * - CreateOrderInput - The input type for the createOrder function.
 * - CreateOrderOutput - The return type for the createOrder function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { supabaseClient } from '@/lib/supabase';
import type { Order, Address as OrderAddress, Payment } from '@/hooks/use-orders';
import type { Customer } from '@/hooks/use-customers';

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

const AddressSchema = z.object({
  department: z.string(),
  municipality: z.string(),
  colony: z.string().optional(),
  exactAddress: z.string(),
});

const CreateOrderInputSchema = z.object({
  customer: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    address: AddressSchema.optional(),
  }),
  items: z.array(ProductSchema),
  total: z.number(),
  shippingCost: z.number().optional(),
  paymentMethod: z.enum(['efectivo', 'tarjeta', 'transferencia', 'credito']),
  deliveryMethod: z.enum(['pickup', 'delivery']).optional(),
  paymentDueDate: z.string().optional(),
  cashAmount: z.number().optional(),
  paymentReference: z.string().optional(),
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

// Helper to add or update a customer
const addOrUpdateCustomer = async (
  customerData: { phone?: string; name?: string; address?: OrderAddress }, 
  totalToAdd: number
): Promise<string | null> => {
    if (!customerData.phone && !customerData.name) {
        return null;
    }

    const { data: existingCustomer, error: findError } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('phone', customerData.phone)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 is 'not found'
      console.error('Error finding customer:', findError);
      throw new Error('No se pudo verificar el cliente.');
    }

    if (existingCustomer) {
      const { data: updatedCustomer, error: updateError } = await supabaseClient
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
        throw new Error('No se pudo actualizar el cliente.');
      }
      return updatedCustomer.id;
    } else {
      const { data: newCustomer, error: insertError } = await supabaseClient
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
        throw new Error('No se pudo crear el nuevo cliente.');
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
    try {
      const customerId = await addOrUpdateCustomer({
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

       const { data, error } = await supabaseClient
        .from('orders')
        .insert([newOrderData])
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error al crear pedido en DB: ${error.message}`);
      }

      const newOrder = data as Order;
      
      // Update stock for each item
      for (const item of newOrder.items) {
          const { error: stockError } = await supabaseClient.rpc('decrease_stock', {
              product_id: item.id,
              quantity_to_decrease: item.quantity
          });
          if (stockError) {
              // Note: In a real-world scenario, you'd want to handle this more gracefully,
              // maybe by trying to revert the order creation or flagging it for manual review.
              console.error(`Failed to update stock for product ${item.id}:`, stockError.message);
          }
      }

      return {
        orderId: newOrder.display_id,
        success: true,
      };
    } catch (error: any) {
      console.error("Error creating order in flow:", error);
      return {
        orderId: '',
        success: false,
      };
    }
  }
);
