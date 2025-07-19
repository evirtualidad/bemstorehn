
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetFooter,
} from '@/components/ui/sheet';
import { useCart } from '@/hooks/use-cart';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { Separator } from './ui/separator';
import Link from 'next/link';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/hooks/use-settings-store';

export function CartSheet() {
  const {
    items,
    total,
    subtotal,
    taxAmount,
    isOpen,
    toggleCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();
  const { currency } = useCurrencyStore();
  const { taxRate } = useSettingsStore();

  return (
    <Sheet open={isOpen} onOpenChange={toggleCart}>
      <SheetContent className="flex w-full flex-col sm:max-w-md p-0 bg-background">
        <SheetHeader className="p-4 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-bold text-lg">Tu Carrito</SheetTitle>
            <SheetClose asChild>
                <Button variant="ghost" size="icon">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Cerrar</span>
                </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        
        {items.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              <ScrollArea className="h-full -mx-4">
                <div className="flex flex-col gap-5 p-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-secondary">
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
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() => decreaseQuantity(item.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-bold w-5 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() => increaseQuantity(item.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                           <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-7 w-7"
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
            </div>
            <SheetFooter className="border-t p-4 space-y-4 bg-background">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <p className="text-muted-foreground">Subtotal</p>
                    <p className="font-medium">{formatCurrency(subtotal, currency.code)}</p>
                </div>
                 <div className="flex justify-between">
                    <p className="text-muted-foreground">Envío</p>
                    <p className="font-medium">Calculado en el checkout</p>
                </div>
                <div className="flex justify-between">
                    <p className="text-muted-foreground">Impuestos ({taxRate * 100}%)</p>
                    <p className="font-medium">{formatCurrency(taxAmount, currency.code)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <p>Total</p>
                <p>{formatCurrency(total, currency.code)}</p>
              </div>
              <SheetClose asChild>
                <Button asChild className="w-full text-md" size="lg">
                    <Link href="/checkout">Finalizar Compra</Link>
                </Button>
              </SheetClose>
            </SheetFooter>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-6">
            <ShoppingBag className="w-16 h-16 text-muted-foreground" />
            <h2 className="text-xl font-bold">Tu carrito está vacío</h2>
            <p className="text-muted-foreground text-sm">
              ¡Explora nuestros productos y encuentra tus nuevos favoritos!
            </p>
            <SheetClose asChild>
              <Button variant="secondary">
                Continuar Comprando
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
