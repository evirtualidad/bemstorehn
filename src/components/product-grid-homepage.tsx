
'use client';

import type { Product } from '@/lib/products';
import { ProductCard } from './product-card';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

interface ProductGridHomepageProps {
  products: Product[];
}

function ProductGridHomepage({ products }: ProductGridHomepageProps) {
  const addToCart = useCart.getState().addToCart;
  const { toast } = useToast();

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: "Añadido al carrito",
      description: `${product.name} ha sido añadido a tu carrito.`,
    });
  };

  if (products.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No se encontraron productos en esta categoría.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}

// Attach the Card component to the main component for the carousel usage
ProductGridHomepage.Card = ProductCard;

export { ProductGridHomepage };
