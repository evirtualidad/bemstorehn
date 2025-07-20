'use client';

import * as React from 'react';
import { usePosCart } from '@/hooks/use-pos-cart';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import Image from 'next/image';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function PosCart({ onCheckoutSuccess }: { onCheckoutSuccess: () => void }) {
  const {
    items,
    total,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = usePosCart();
  const { currency } = useCurrencyStore();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleOpenCheckout = () => {
    if (items.length > 0) {
      setIsCheckoutOpen(true);
    }
  };
  
  const handleCheckoutSuccess = () => {
    onCheckoutSuccess();
    setIsCheckoutOpen(false);
  }

  const taxRate = 0.15; // Example tax rate
  const subtotal = total / (1 + taxRate);
  const tax = total - subtotal;
  
  return (
    <>
    <aside className="h-full w-full flex-shrink-0 flex flex-col bg-card">
      <header className="pb-4">
        <h2 className="text-xl font-bold">Current Order</h2>
        <div className='flex items-center gap-3 mt-4'>
            <Avatar className="h-9 w-9">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>EW</AvatarFallback>
            </Avatar>
            <p className='font-semibold'>Emma Wang</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <p className="font-medium">Your cart is empty</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mr-4 pr-4">
            <div className="space-y-4 py-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                   <div className="relative h-12 w-12 flex-shrink-0">
                        <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="rounded-md border object-cover bg-secondary"
                        />
                    </div>
                  <div className="flex-1">
                    <p className="font-semibold leading-tight text-sm">
                      {item.name}
                    </p>
                    <p className="text-xs font-bold text-muted-foreground">
                      {formatCurrency(item.price, currency.code)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary p-0.5 rounded-full">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-full"
                      onClick={() => decreaseQuantity(item.id)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-4 text-center font-bold text-xs">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-full"
                      onClick={() => increaseQuantity(item.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <footer className="pt-4 mt-auto">
        <div className="space-y-1 text-sm">
            <div className="flex justify-between">
                <p className="text-muted-foreground">Subtotal</p>
                <p className="font-medium">{formatCurrency(subtotal, currency.code)}</p>
            </div>
             <div className="flex justify-between">
                <p className="text-muted-foreground">Discount</p>
                <p className="font-medium">{formatCurrency(0, currency.code)}</p>
            </div>
             <div className="flex justify-between">
                <p className="text-muted-foreground">Tax</p>
                <p className="font-medium">{formatCurrency(tax, currency.code)}</p>
            </div>
        </div>
        <Separator className="my-3"/>
        <div className="space-y-4">
          <div className="flex justify-between text-md font-bold">
            <p>Total</p>
            <p>{formatCurrency(total, currency.code)}</p>
          </div>
          <Button
            size="lg"
            className="h-12 w-full text-base rounded-lg"
            disabled={items.length === 0}
            onClick={handleOpenCheckout}
          >
            Continue
          </Button>
        </div>
      </footer>
    </aside>
     <CheckoutDialog
        isOpen={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        onCheckoutSuccess={handleCheckoutSuccess}
      />
    </>
  );
}
