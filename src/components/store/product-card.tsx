
'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import { useCart } from '@/hooks/use-cart';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import Link from 'next/link';

interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: Product;
}

export function ProductCard({ 
  product, 
  className, 
  ...props 
}: ProductCardProps) {
  const { currency } = useCurrencyStore();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const isDiscounted = product.originalPrice && product.originalPrice > product.price;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast({
      title: "Añadido al carrito",
      description: `${product.name} ha sido añadido a tu carrito.`,
    });
  };

  return (
    <div {...props} className={cn("group", className)}>
      <Card className="flex flex-col overflow-hidden h-full border-0 shadow-none rounded-lg bg-secondary">
        <Link href={`/product/${product.id}`} className="block">
          <div className="p-2">
            <div className="relative overflow-hidden aspect-[4/5] rounded-lg">
              <Image
                src={product.image || 'https://placehold.co/400x500.png'}
                alt={product.name}
                fill
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                data-ai-hint={product.aiHint}
              />
              {isDiscounted && (
                <Badge variant="destructive" className="absolute top-2 left-2 rounded-full">
                  Oferta
                </Badge>
              )}
            </div>
          </div>
        </Link>
        <div className="p-4 pt-0 flex-grow flex flex-col">
          <h3 className="font-semibold text-sm leading-tight h-10 line-clamp-2">{product.name}</h3>
          <div className="flex items-end justify-between mt-2">
            <div className="flex flex-col">
                <p className={cn("text-lg font-bold text-foreground", isDiscounted && "text-destructive")}>
                    {formatCurrency(product.price, currency.code)}
                </p>
                 {isDiscounted && (
                    <p className="text-xs text-muted-foreground line-through">
                        {formatCurrency(product.originalPrice!, currency.code)}
                    </p>
                )}
            </div>
             <Button 
                variant="default"
                size="icon"
                className="rounded-full h-9 w-9 shrink-0"
                disabled={product.stock <= 0}
                onClick={handleAddToCart}
                aria-label={`Añadir ${product.name} al carrito`}
              >
                <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
