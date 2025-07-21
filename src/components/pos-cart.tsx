
'use client';

import * as React from 'react';
import { usePosCart } from '@/hooks/use-pos-cart';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import Image from 'next/image';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';

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
    removeFromCart,
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
        <DialogContent className="max-w-md w-full h-[90vh] flex flex-col p-0 gap-0 rounded-lg" hideClose>
          <DialogHeader className="p-4 border-b flex-shrink-0">
             <div className='flex items-center justify-between'>
                <DialogClose asChild>
                    <Button variant="ghost" size="sm" className="gap-2 text-base">
                        <ArrowLeft className='h-5 w-5'/>
                        Atrás
                    </Button>
                </DialogClose>
                <DialogTitle className="text-xl font-bold">Pedido Actual</DialogTitle>
                <Button variant="ghost" size="sm" className='text-muted-foreground gap-2 text-base' onClick={clearCart}>
                    <Trash2 className='h-5 w-5'/>
                    <span>Limpiar</span>
                </Button>
              </div>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col min-h-0 bg-muted/30">
            {items.length > 0 ? (
                <ScrollArea className="flex-1">
                    <div className="p-4 flex flex-col gap-4">
                        {items.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 bg-background p-3 rounded-lg shadow-sm">
                                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-secondary">
                                    <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover p-1"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm leading-tight line-clamp-2">{item.name}</p>
                                    <p className="font-bold text-sm text-foreground mt-1">
                                    {formatCurrency(item.price, currency.code)}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Button
                                        size="icon"
                                        className="h-7 w-7 rounded-full bg-red-100 text-red-700 hover:bg-red-200"
                                        onClick={() => decreaseQuantity(item.id)}
                                        >
                                        <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="font-bold w-5 text-center">{item.quantity}</span>
                                        <Button
                                        size="icon"
                                        className="h-7 w-7 rounded-full bg-green-100 text-green-700 hover:bg-green-200"
                                        onClick={() => increaseQuantity(item.id)}
                                        >
                                        <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 bg-red-100 hover:bg-red-200 hover:text-red-600 h-7 w-7"
                                        onClick={() => removeFromCart(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            ) : (
                 <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6 h-full">
                    <ShoppingBag className="w-24 h-24 text-muted-foreground/30" />
                    <h2 className="text-xl font-bold">El pedido está vacío</h2>
                    <p className="text-muted-foreground max-w-xs text-sm">
                        Añade productos desde el menú para empezar una nueva venta.
                    </p>
                </div>
            )}
            
            {items.length > 0 && (
                <div className="flex-shrink-0">
                    <DialogFooter className="p-4 space-y-4 bg-card border-t flex-col !space-x-0">
                        <div className="w-full space-y-2 text-sm">
                            <div className="flex justify-between">
                                <p className="text-muted-foreground">Subtotal</p>
                                <p className="font-medium">{formatCurrency(subtotal, currency.code)}</p>
                            </div>
                            <div className="flex justify-between">
                                <p className="text-muted-foreground">ISV ({ (taxRate * 100).toFixed(0) }%)</p>
                                <p className="font-medium">{formatCurrency(tax, currency.code)}</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="w-full flex justify-between text-lg font-bold">
                            <p>Total</p>
                            <p>{formatCurrency(total, currency.code)}</p>
                        </div>
                        <Button 
                            size="lg" 
                            className="w-full text-md" 
                            onClick={handleOpenCheckout}
                            disabled={items.length === 0}
                        >
                            Continuar al Pago
                        </Button>
                    </DialogFooter>
                </div>
            )}
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
