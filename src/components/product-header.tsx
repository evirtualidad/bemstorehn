
'use client';

import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';

export function ProductHeader() {
  const router = useRouter();
  const { toggleCart } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-20 p-4">
      <div className="flex items-center justify-between">
        <Button
          size="icon"
          className="h-11 w-11 rounded-full bg-black text-white"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          className="h-11 w-11 rounded-full bg-white text-black shadow-md"
          onClick={toggleCart}
        >
          <ShoppingBag className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
