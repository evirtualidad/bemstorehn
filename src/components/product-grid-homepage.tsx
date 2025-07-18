
import type { Product } from '@/lib/products';
import { ProductCard } from './product-card';

interface ProductGridHomepageProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGridHomepage({ products, onAddToCart }: ProductGridHomepageProps) {
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
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
