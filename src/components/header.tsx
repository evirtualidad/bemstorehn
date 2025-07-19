
'use client';

import { Search, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';

export function Header() {
  const { items, toggleCart } = useCart();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="py-4 px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground tracking-wide">
            BEM
          </h1>
        </Link>
        
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="relative hidden md:flex">
              <Search className="w-5 h-5" />
              <span className="sr-only">Buscar</span>
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={toggleCart}>
              {itemCount > 0 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold">
                  {itemCount}
                </div>
              )}
              <ShoppingCart className="w-5 h-5" />
              <span className="sr-only">Carrito de Compras</span>
            </Button>
        </div>
      </div>
    </header>
  );
}
