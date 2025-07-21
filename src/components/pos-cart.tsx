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

const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'debit', label: 'Debit' },
    { value: 'qr', label: 'QRIS' },
]

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

  return (
    <div className="h-full w-full flex flex-col bg-card">
        <header className="pb-4 flex-shrink-0">
          <div className='flex items-center justify-between'>
            <h2 className="text-xl font-bold">Detail Items</h2>
            <Button variant="ghost" size="icon" className='text-muted-foreground' onClick={clearCart}>
                <Trash2 className='h-5 w-5'/>
            </Button>
          </div>
        </header>

        <div className="flex-1 min-h-0">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <p className="font-medium">Cart is empty</p>
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
                    <div className="flex-1">
                      <p className="font-semibold leading-tight text-sm line-clamp-1">
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
                    <p className='font-bold text-sm w-16 text-right'>{formatCurrency(item.price * item.quantity, currency.code)}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <footer className="pt-4 flex-shrink-0">
          <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                  <p className="text-muted-foreground">Item ({items.length})</p>
                  <p className="font-medium">{formatCurrency(total, currency.code)}</p>
              </div>
              <div className="flex justify-between">
                  <p className="text-muted-foreground">Discount</p>
                  <p className="font-medium">{formatCurrency(0, currency.code)}</p>
              </div>
              <div className="flex justify-between">
                  <p className="text-muted-foreground">Tax ({ (taxRate * 100).toFixed(0) }%)</p>
                  <p className="font-medium">{formatCurrency(tax, currency.code)}</p>
              </div>
          </div>
          <Separator className="my-3"/>
            <div className="flex justify-between text-lg font-bold mb-4">
              <p>Total</p>
              <p>{formatCurrency(total, currency.code)}</p>
            </div>

           <div>
             <h3 className="text-lg font-bold mb-3">Payment Method</h3>
             <div className='grid grid-cols-3 gap-2'>
                {paymentMethods.map(method => (
                    <Button 
                        key={method.value}
                        variant={selectedPayment === method.value ? 'secondary' : 'outline'}
                        onClick={() => setSelectedPayment(method.value)}
                        className={cn('h-12 border-2', selectedPayment === method.value && 'border-primary bg-accent')}
                    >
                       {method.label}
                    </Button>
                ))}
             </div>
           </div>
          <div className="space-y-4 mt-5">
            <Button
              size="lg"
              className="h-14 w-full text-base rounded-lg"
              disabled={items.length === 0}
              onClick={handleOpenCheckout}
            >
              Process Transaction
            </Button>
          </div>
        </footer>
      <CheckoutDialog
          isOpen={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          onCheckoutSuccess={handleCheckoutSuccess}
        />
    </div>
  );
}
