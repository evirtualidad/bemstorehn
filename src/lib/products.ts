
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

// This interface is used for form submissions, which might include a File object
// that is not part of the final Product type stored in the DB.
export type UploadProductData = Omit<Product, 'id' | 'created_at'> & {
  imageFile?: File;
};


// This file now only contains the type definition.
// The initial product data should be seeded directly into your Supabase database.
export const products: Product[] = [];
