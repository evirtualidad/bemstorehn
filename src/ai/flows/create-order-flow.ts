
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


const createOrderFlow = ai.defineFlow(
  {
    name: 'createOrderFlow',
    inputSchema: CreateOrderInputSchema,
    outputSchema: CreateOrderOutputSchema,
  },
  async (input) => {
    try {
      // Simulate creating an order by logging it to the console
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      
      console.log("--- MOCK ORDER CREATED ---");
      console.log("Order ID:", orderId);
      console.log("Customer:", input.customer.name || 'Consumidor Final');
      if (input.deliveryMethod === 'delivery' && input.customer.address) {
        console.log("Delivery Method: Envío a Domicilio");
        console.log("Address:", `${input.customer.address.exactAddress}, ${input.customer.address.colony}, ${input.customer.address.municipality}, ${input.customer.address.department}`);
      } else if (input.deliveryMethod === 'pickup') {
         console.log("Delivery Method: Recoger en Tienda");
      }
      console.log("Items:", input.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })));
      if (input.shippingCost) {
        console.log("Shipping Cost:", input.shippingCost);
      }
      console.log("Total:", input.total);
      console.log("Payment Method:", input.paymentMethod);
      if (input.paymentMethod === 'efectivo' && input.cashAmount) {
        console.log("Cash Received:", input.cashAmount);
        console.log("Change Given:", input.cashAmount - input.total);
      }
      if (input.paymentReference) {
        console.log("Payment Reference:", input.paymentReference);
      }
      if (input.paymentDueDate) {
        console.log("Payment Due Date:", new Date(input.paymentDueDate).toLocaleDateString());
      }
      console.log("--------------------------");

      // In a real app, stock update would happen here in a secure server-side transaction.
      // For this local simulation, the client will handle the stock update after getting a success response.

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
