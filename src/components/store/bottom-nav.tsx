
'use client';

import * as React from 'react';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { Button } from '../ui/button';

export function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const totalCartItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // Hide on pages where it's not needed (admin, checkout, cart, etc.)
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/product/') ||
    pathname.startsWith('/order-confirmation') ||
    pathname === '/cart' ||
    pathname === '/login'
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 xl:hidden">
      <Button
        asChild
        variant="default"
        className={cn(
          'h-16 w-16 rounded-full shadow-2xl flex items-center justify-center relative transform transition-transform duration-300 hover:scale-110'
        )}
      >
        <Link href="/cart" aria-label={`View cart with ${totalCartItems} items`}>
          <ShoppingCart className="h-7 w-7" />
          {totalCartItems > 0 && (
            <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-background">
              {totalCartItems}
            </div>
          )}
        </Link>
      </Button>
    </div>
  );
}
