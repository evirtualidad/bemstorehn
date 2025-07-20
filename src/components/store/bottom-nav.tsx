
'use client';

import * as React from 'react';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const shouldHideNav = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/checkout') || 
    pathname.startsWith('/order-confirmation') || 
    pathname.startsWith('/login') ||
    pathname.startsWith('/cart');

  if (shouldHideNav || !isClient) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-6 right-6 z-50">
      <Button
        asChild
        className="rounded-full w-16 h-16 shadow-lg"
      >
        <Link
          href="/cart"
          className={cn(
            'relative flex items-center justify-center'
          )}
        >
          <ShoppingCart className="w-7 h-7" />
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 rounded-full h-6 w-6 flex items-center justify-center text-xs border-2 border-background"
            >
              {totalItems}
            </Badge>
          )}
        </Link>
      </Button>
    </div>
  );
}
