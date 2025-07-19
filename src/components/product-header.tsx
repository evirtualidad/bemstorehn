
'use client';

import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import Link from 'next/link';

export function ProductHeader() {
  const router = useRouter();
  const { items } = useCart();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 p-4">
      <div className="flex items-center justify-between">
        <Button
          size="icon"
          className="h-11 w-11 rounded-full bg-black/30 text-white backdrop-blur-sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <Button
          asChild
          size="icon"
          variant="secondary"
          className="relative h-11 w-11 rounded-full bg-white/50 text-black shadow-md backdrop-blur-sm"
        >
          <Link href="/cart">
            <ShoppingBag className="h-5 w-5" />
             {totalItems > 0 && (
                <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-background">
                    {totalItems}
                </div>
            )}
          </Link>
        </Button>
      </div>
    </header>
  );
}
