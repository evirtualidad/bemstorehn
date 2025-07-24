
'use client';

import * as React from 'react';
import { ShoppingCart } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePosCart } from '@/hooks/use-pos-cart';
import { PosCart } from '@/components/pos-cart';
import { Button } from '../ui/button';

export function PosFab() {
  const pathname = usePathname();
  const { items, clearCart } = usePosCart();
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckoutSuccess = () => {
    clearCart();
    setIsCartOpen(false);
  };

  if (pathname !== '/admin/pos') {
    return null;
  }

  return (
    <>
        <div className="fixed bottom-6 right-6 z-50">
        <Button
            variant="default"
            onClick={() => setIsCartOpen(true)}
            className={cn(
            'h-16 w-16 rounded-full shadow-2xl flex items-center justify-center relative transform transition-transform duration-300 hover:scale-110'
            )}
        >
            <ShoppingCart className="h-7 w-7" />
            {totalItems > 0 && (
                <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-background">
                {totalItems}
                </div>
            )}
        </Button>
        </div>
        <PosCart
            isOpen={isCartOpen}
            onOpenChange={setIsCartOpen}
            onCheckoutSuccess={handleCheckoutSuccess}
        />
    </>
  );
}
