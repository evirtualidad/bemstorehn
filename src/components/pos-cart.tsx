
'use client';

import * as React from 'react';
import { usePosCart } from '@/hooks/use-pos-cart';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import Image from 'next/image';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';


export function PosCart({ onCheckoutSuccess }: { onCheckoutSuccess: () => void }) {
  const {
    items,
    total,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = usePosCart();
  const { currency } = useCurrencyStore();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState('cash');

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
  const discount = 0; // Example discount

  return (
    <div className="h-full w-full flex flex-col bg-card rounded-lg p-5">
      <header className="pb-4 flex-shrink-0">
        <div className='flex items-center justify-between'>
          <h2 className="text-xl font-bold">Order details</h2>
          <Button variant="ghost" size="icon" className='text-muted-foreground' onClick={clearCart}>
              <Trash2 className='h-5 w-5'/>
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <p className="font-medium">No items in the order</p>
          </div>
        ) : (
          <ScrollArea className="h-full -mr-4 pr-4">
            <div className="space-y-4 py-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 flex-shrink-0">
                      <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="rounded-md border object-cover bg-secondary"
                      />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold leading-tight text-sm truncate">
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
                      className="h-6 w-6 rounded-full"
                      onClick={() => decreaseQuantity(item.id)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-5 text-center font-bold text-sm">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={() => increaseQuantity(item.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <footer className="pt-4 flex-shrink-0">
        <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <p className="text-muted-foreground">Sub Total</p>
                <p className="font-medium">{formatCurrency(subtotal, currency.code)}</p>
            </div>
            <div className="flex justify-between">
                <p className="text-muted-foreground">Tax ({ (taxRate * 100).toFixed(0) }%)</p>
                <p className="font-medium">{formatCurrency(tax, currency.code)}</p>
            </div>
             <div className="flex justify-between">
                <p className="text-muted-foreground">Discount</p>
                <p className="font-medium text-destructive">{formatCurrency(discount, currency.code)}</p>
            </div>
        </div>
        <Separator className="my-3"/>
          <div className="flex justify-between text-lg font-bold mb-4">
            <p>Total</p>
            <p>{formatCurrency(total - discount, currency.code)}</p>
          </div>

        <Button
            size="lg"
            className="h-14 w-full text-base rounded-lg bg-primary hover:bg-primary/90"
            disabled={items.length === 0}
            onClick={handleOpenCheckout}
          >
            Confirm order
          </Button>
      </footer>
      <CheckoutDialog
          isOpen={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          onCheckoutSuccess={handleCheckoutSuccess}
        />
    </div>
  );
}

