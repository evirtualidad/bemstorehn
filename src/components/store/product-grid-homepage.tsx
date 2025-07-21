
'use client';

import * as React from 'react';
import type { Product } from '@/lib/types';
import { ProductCard } from '../product-card';

// Namespace component for better organization
const ProductGridHomepage = ({ products }: { products: Product[] }) => {
  if (products.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No se encontraron productos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

// Assign the card component to the namespace
ProductGridHomepage.Card = ProductCard;

export { ProductGridHomepage };
