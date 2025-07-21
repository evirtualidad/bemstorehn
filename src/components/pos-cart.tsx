
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
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface PosCartProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onCheckoutSuccess: () => void;
}

export function PosCart({ isOpen, onOpenChange, onCheckoutSuccess }: PosCartProps) {
  const {
    items,
    total,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  } = usePosCart();
  const { currency } = useCurrencyStore();
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);

  const handleOpenCheckout = () => {
    if (items.length > 0) {
      setIsCheckoutOpen(true);
    }
  };

  const handleCheckoutSuccess = () => {
    onCheckoutSuccess();
    setIsCheckoutOpen(false); // Close checkout dialog
    onOpenChange(false); // Close main cart dialog
  };

  const taxRate = 0.15; // Example tax rate
  const subtotal = total / (1 + taxRate);
  const tax = total - subtotal;
  const discount = 0; // Example discount

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
          <div className="flex-1 flex flex-col bg-card rounded-lg overflow-hidden">
            <header className="p-5 pb-4 flex-shrink-0 border-b">
              <div className='flex items-center justify-between'>
                <h2 className="text-xl font-bold">Detalles del Pedido</h2>
                <Button variant="ghost" size="icon" className='text-muted-foreground' onClick={clearCart}>
                    <Trash2 className='h-5 w-5'/>
                </Button>
              </div>
            </header>

            <main className="flex-1 min-h-0 flex overflow-hidden">
                <ScrollArea className="flex-1">
                    <div className='p-5'>
                    {items.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                        <p className="font-medium">No hay productos en el pedido</p>
                    </div>
                    ) : (
                    <div className="space-y-4">
                        {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                            <div className="relative h-16 w-16 flex-shrink-0">
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
                                className="h-7 w-7 rounded-full"
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
                                className="h-7 w-7 rounded-full"
                                onClick={() => increaseQuantity(item.id)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                            </div>
                        </div>
                        ))}
                    </div>
                    )}
                    </div>
                </ScrollArea>

                 <aside className='w-[350px] bg-muted/40 border-l p-5 flex flex-col'>
                    <h3 className='text-lg font-bold mb-4'>Resumen</h3>
                     <div className="space-y-2 text-sm flex-1">
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Sub Total</p>
                            <p className="font-medium">{formatCurrency(subtotal, currency.code)}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Impuestos ({ (taxRate * 100).toFixed(0) }%)</p>
                            <p className="font-medium">{formatCurrency(tax, currency.code)}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Descuento</p>
                            <p className="font-medium text-destructive">{formatCurrency(discount, currency.code)}</p>
                        </div>
                    </div>
                    <Separator className="my-4"/>
                    <div className="flex justify-between text-lg font-bold mb-4">
                        <p>Total</p>
                        <p>{formatCurrency(total - discount, currency.code)}</p>
                    </div>
                    <Button
                        size="lg"
                        className="h-12 w-full text-base rounded-lg bg-primary hover:bg-primary/90"
                        disabled={items.length === 0}
                        onClick={handleOpenCheckout}
                    >
                        Continuar al Pago
                    </Button>
                </aside>
            </main>

          </div>
        </DialogContent>
      </Dialog>
      <CheckoutDialog
          isOpen={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          onCheckoutSuccess={handleCheckoutSuccess}
        />
    </>
  );
}
