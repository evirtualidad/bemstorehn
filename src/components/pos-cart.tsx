
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
import { CheckoutDialog } from './checkout-dialog';
import { useState } from 'react';
import type { Customer } from '@/lib/types';
import { useToast } from './ui/use-toast';

interface PosCartProps {
  // No props needed as it uses the hook internally
}

export function PosCart({}: PosCartProps) {
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
  const { toast } = useToast();

  const handleOpenCheckout = () => {
    if (items.length > 0) {
      setIsCheckoutOpen(true);
    }
  };
  
  const handleConfirmCheckout = (customer: Customer | null, paymentMethod: string) => {
    // In a real app, you would save this order to a database.
    console.log("Venta Confirmada:", {
        customer: customer?.name ?? "Cliente Genérico",
        paymentMethod,
        total,
        items
    });

    toast({
      title: "Venta Registrada",
      description: `Venta a ${customer?.name ?? "Cliente Genérico"} por L. ${total.toFixed(2)} con ${paymentMethod}.`,
    });
    clearCart();
  }

  return (
    <>
    <aside className="h-full w-full flex-shrink-0 flex flex-col bg-card rounded-lg shadow-lg">
      <header className="p-4 border-b">
        <h2 className="text-xl font-bold">Pedido Actual</h2>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden px-4">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <ShoppingCart className="mb-4 h-16 w-16" />
            <p className="text-lg font-medium">El carrito está vacío</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mr-4 pr-4">
            <div className="space-y-4 py-4">
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

      <footer className="p-4 border-t">
        <div className="space-y-4">
          <div className="flex justify-between text-lg font-bold">
            <p>Total</p>
            <p>{formatCurrency(total, currency.code)}</p>
          </div>
          <Button
            size="lg"
            className="h-12 w-full text-base"
            disabled={items.length === 0}
            onClick={handleOpenCheckout}
          >
            Completar Venta
          </Button>
        </div>
      </footer>
    </aside>
     <CheckoutDialog
        isOpen={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        cart={items}
        total={total}
        onConfirm={handleConfirmCheckout}
      />
    </>
  );
}
