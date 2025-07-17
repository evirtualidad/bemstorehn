
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { useCart } from '@/hooks/use-cart';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import Image from 'next/image';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { Separator } from './ui/separator';
import Link from 'next/link';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/hooks/use-settings-store';

export function CartSheet() {
  const {
    items,
    total,
    subtotal,
    taxAmount,
    shippingCost,
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
      <SheetContent className="flex w-full flex-col sm:max-w-xl p-0">
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <SheetTitle>Carrito de Compras ({items.length})</SheetTitle>
            <SheetClose asChild>
                <Button variant="ghost" size="icon" className={cn('h-12 w-12 p-2 bg-destructive/20 text-destructive hover:bg-muted hover:text-muted-foreground')}>
                    <X className="h-8 w-8" />
                    <span className="sr-only">Cerrar</span>
                </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        <Separator />

        {items.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-4 p-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price, currency.code)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => decreaseQuantity(item.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span>{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => increaseQuantity(item.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="border-t p-6 space-y-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <p className="text-muted-foreground">Subtotal</p>
                    <p>{formatCurrency(subtotal, currency.code)}</p>
                </div>
                <div className="flex justify-between">
                    <p className="text-muted-foreground">ISV ({taxRate * 100}%)</p>
                    <p>{formatCurrency(taxAmount, currency.code)}</p>
                </div>
                 <div className="flex justify-between">
                    <p className="text-muted-foreground">Envío</p>
                    <p>{shippingCost > 0 ? formatCurrency(shippingCost, currency.code) : "Calculado en el checkout"}</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <p>Total</p>
                <p>{formatCurrency(total, currency.code)}</p>
              </div>
              <SheetClose asChild>
                <Button asChild className="w-full" size="lg">
                    <Link href="/checkout">Finalizar Compra</Link>
                </Button>
              </SheetClose>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Tu carrito está vacío.</h2>
            <p className="text-muted-foreground">
              Parece que no has añadido nada todavía. <br />
              ¡Explora nuestros productos!
            </p>
            <Button onClick={toggleCart} variant="outline">
              Continuar Comprando
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
