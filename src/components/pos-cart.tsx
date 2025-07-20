
'use client';

import * as React from 'react';
import { usePosCart } from '@/hooks/use-pos-cart';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import Image from 'next/image';

interface PosCartProps {
  onCheckoutSuccess: () => void;
}

export function PosCart({ onCheckoutSuccess }: PosCartProps) {
  const {
    items,
    totalWithShipping,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = usePosCart();
  const { currency } = useCurrencyStore();

  const handleCheckout = () => {
    // This will be replaced by a dialog later
    console.log('Checkout:', items);
    onCheckoutSuccess();
  };

  return (
    <aside className="h-full w-full flex-shrink-0 flex-col border bg-card p-4 flex rounded-lg shadow-lg">
      <header className="p-4 pl-0">
        <h2 className="text-xl font-bold">Pedido Actual</h2>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <ShoppingCart className="mb-4 h-16 w-16" />
            <p className="text-lg font-medium">El carrito está vacío</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mr-4 pr-4">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="rounded-md border object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold leading-tight line-clamp-2">
                      {item.name}
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {formatCurrency(item.price, currency.code)}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => decreaseQuantity(item.id)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center font-bold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => increaseQuantity(item.id)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <footer className="pt-4">
        <div className="space-y-4">
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <p>Total</p>
            <p>{formatCurrency(totalWithShipping, currency.code)}</p>
          </div>
          <Button
            size="lg"
            className="h-12 w-full text-base"
            disabled={items.length === 0}
            onClick={handleCheckout}
          >
            Completar Venta
          </Button>
        </div>
      </footer>
    </aside>
  );
}
