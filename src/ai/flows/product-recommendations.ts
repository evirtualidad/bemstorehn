
'use server';
/**
 * @fileOverview A flow that provides product recommendations based on cart contents.
 *
 * - getRecommendedProducts - A function that handles the product recommendation process.
 * - RecommendedProductsInput - The input type for the getRecommendedProducts function.
 * - RecommendedProductsOutput - The return type for the getRecommended-products function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { type Product } from '@/lib/products';

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().optional(),
  image: z.string(),
  category: z.string(),
  description: z.string(),
  stock: z.number(),
});

const RecommendedProductsInputSchema = z.object({
  productsInCart: z.array(ProductSchema).describe("A list of products currently in the user's shopping cart."),
  allProducts: z.array(ProductSchema).describe("The full catalog of products available in the store."),
});

export type RecommendedProductsInput = z.infer<typeof RecommendedProductsInputSchema>;

const RecommendedProductsOutputSchema = z.object({
  recommendations: z
    .array(
      ProductSchema.pick({
        id: true,
        name: true,
        image: true,
        price: true,
        description: true,
        category: true,
        stock: true,
      }).extend({
        aiHint: z.string().optional(),
        featured: z.boolean().optional(),
      })
    )
    .describe('An array of 3 recommended products.'),
});
export type RecommendedProductsOutput = z.infer<typeof RecommendedProductsOutputSchema>;

export async function getRecommendedProducts(input: RecommendedProductsInput): Promise<RecommendedProductsOutput> {
  return recommendProductsFlow(input);
}

const recommendationPrompt = ai.definePrompt({
  name: 'recommendationPrompt',
  input: { schema: RecommendedProductsInputSchema },
  output: { schema: RecommendedProductsOutputSchema },
  prompt: `
    You are an expert shopping assistant for a high-end cosmetics store. Your goal is to increase the cart value by recommending relevant products to the user.

    Based on the items currently in the user's shopping cart, recommend exactly 3 additional products from the full product catalog that would complement their selection.

    Do not recommend products that are already in the cart.
    Only recommend products that are in stock (stock > 0).

    Analyze the categories and types of products in the cart. For example:
    - If they have skincare, recommend other skincare items that fit into a routine (e.g., if they have a cleanser, recommend a moisturizer or serum).
    - If they have makeup, suggest complementary items (e.g., if they have foundation, recommend a primer or setting powder).
    - If they have shampoo, recommend the matching conditioner.

    Provide your response in the requested JSON format. Make sure to include the image URL for each recommended product.

    Here is the full list of available products:
    {{#each allProducts}}
    - ID: {{id}}, Name: {{name}}, Category: {{category}}, Description: {{description}}, Stock: {{stock}}, Image: {{image}}
    {{/each}}

    Here are the items currently in the user's cart:
    {{#each productsInCart}}
    - Name: {{name}}, Category: {{category}}
    {{/each}}
  `,
});

const recommendProductsFlow = ai.defineFlow(
  {
    name: 'recommendProductsFlow',
    inputSchema: RecommendedProductsInputSchema,
    outputSchema: RecommendedProductsOutputSchema,
  },
  async (input) => {
    // Filter out products that are already in the cart from the list of all products.
    const productIdsInCart = new Set(input.productsInCart.map(p => p.id));
    const availableProducts = input.allProducts.filter(p => !productIdsInCart.has(p.id));

    // If there are no available products to recommend, return an empty array.
    if (availableProducts.length === 0) {
      return { recommendations: [] };
    }

    const { output } = await recommendationPrompt({
        ...input,
        allProducts: availableProducts
    });
    return output!;
  }
);
