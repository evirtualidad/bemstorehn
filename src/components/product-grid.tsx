
'use client';

import type { Product } from '@/lib/products';
import { ProductCard } from './product-card';
import { usePosCart } from '@/hooks/use-pos-cart';
import { useToast } from '../hooks/use-toast';

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const addToCart = usePosCart.getState().addToCart;
  const { toast } = useToast();

  const handleAddToCart = (product: Product) => {
    const success = addToCart(product);
    if (!success) {
      // Toast logic is handled inside the hook for POS
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No se encontraron productos en esta categoría.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onAddToCart={handleAddToCart}
          useLink={false}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAddToCart(product);
          }}
        />
      ))}
    </div>
  );
}
