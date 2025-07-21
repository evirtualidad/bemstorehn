
'use client';

import * as React from 'react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const {
    items,
    total,
    subtotal,
    taxAmount,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();
  const { currency } = useCurrencyStore();
  const { taxRate } = useSettingsStore();
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-muted/40">
      <header className="p-4 border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between p-0">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-bold">Carrito de Compras</h1>
          <div className="w-10"></div>
        </div>
      </header>
      
      {items.length > 0 ? (
        <>
          <main className="flex-1 overflow-y-auto p-4">
            <div className="container mx-auto p-0 flex flex-col gap-5">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 bg-background p-4 rounded-lg shadow-sm">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-secondary">
                      <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover rounded-md"
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
          </main>
          <footer className="fixed bottom-0 left-0 right-0 border-t p-4 space-y-4 bg-background">
            <div className="container mx-auto p-0 space-y-4">
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
              <Button asChild className="w-full text-md h-14 rounded-full" size="lg">
                <Link href="/checkout">
                  Finalizar Compra
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </footer>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
          <ShoppingBag className="w-24 h-24 text-muted-foreground/50" />
          <h2 className="text-2xl font-bold">Tu carrito está vacío</h2>
          <p className="text-muted-foreground max-w-xs">
            ¡Explora nuestros productos y encuentra tus nuevos favoritos!
          </p>
          <Button asChild variant="secondary" size="lg" className="mt-4">
            <Link href="/">Continuar Comprando</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
