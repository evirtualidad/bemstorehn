
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCart } from '@/hooks/use-cart';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import Image from 'next/image';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';
import Link from 'next/link';
import { getRecommendedProducts, type RecommendedProductsOutput } from '@/ai/flows/product-recommendations';
import { useProductsStore } from '@/hooks/use-products';
import { ProductCard } from './product-card';
import { Skeleton } from './ui/skeleton';

function RecommendedProducts() {
  const { items } = useCart();
  const { products } = useProductsStore();
  const [recommendations, setRecommendations] = React.useState<RecommendedProductsOutput['recommendations']>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchRecommendations() {
      if (items.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await getRecommendedProducts({
          productsInCart: items,
          allProducts: products,
        });
        setRecommendations(result.recommendations || []);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, [items, products]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <h3 className="font-semibold text-lg">También te podría interesar...</h3>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-lg">También te podría interesar...</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {recommendations.map(product => (
          <ProductCard 
            key={product.id}
            // We need to cast here as ProductCard expects a full Product type
            product={product as any}
            className="shadow-none border-none"
          />
        ))}
      </div>
    </div>
  );
}

export function CartSheet() {
  const {
    items,
    total,
    isOpen,
    toggleCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={toggleCart}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-xl">
        <SheetHeader className="px-4">
          <SheetTitle>Carrito de Compras ({items.length})</SheetTitle>
        </SheetHeader>
        <Separator />

        {items.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-4 p-4">
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
                          ${item.price.toFixed(2)}
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
                <Separator />
                <RecommendedProducts />
              </ScrollArea>
            </div>
            <div className="border-t p-4">
              <div className="flex justify-between text-lg font-semibold">
                <p>Subtotal</p>
                <p>${total.toFixed(2)}</p>
              </div>
              <Button asChild className="mt-4 w-full" size="lg">
                <Link href="/checkout" onClick={toggleCart}>Finalizar Compra</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <ShoppingCart className="w-16 h-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Tu carrito está vacío.</h2>
            <p className="text-center text-muted-foreground">
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
