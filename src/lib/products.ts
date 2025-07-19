
export interface Product {
  id: string;
  created_at?: string;
  name: string;
  image: string;
  aiHint?: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: string; 
  stock: number;
  featured?: boolean;
}

// This file now only contains the type definition.
// The initial product data should be seeded directly into your Supabase database.
export const products: Product[] = [];
