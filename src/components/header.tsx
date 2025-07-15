
'use client';

import { Leaf, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { Badge } from '@/components/ui/badge';
import { useProductsStore } from '@/hooks/use-products';

export function Header() {
  const { products } = useProductsStore();
  const categories = [...new Set(products.map((p) => p.category))].map(category => {
    if (category === 'Skincare') return { key: category, label: 'Cuidado de la Piel' };
    if (category === 'Makeup') return { key: category, label: 'Maquillaje' };
    if (category === 'Haircare') return { key: category, label: 'Cuidado del Cabello' };
    return { key: category, label: category };
  });
  
  const { items, toggleCart } = useCart();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="py-4 px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b border-border/40">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-wide">
              Cosmetica
            </h1>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-md">
            {categories.map((category) => (
              <Link
                key={category.key}
                href={`#`}
                className="hover:text-primary transition-colors"
              >
                {category.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" onClick={toggleCart}>
            {itemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center p-0"
              >
                {itemCount}
              </Badge>
            )}
            <ShoppingCart className="w-6 h-6" />
            <span className="sr-only">Carrito de Compras</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
