'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Plus } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

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
       <Link href={`/product/${product.id}`} className="block">
        <Card className="overflow-hidden h-full border shadow-none rounded-2xl bg-secondary p-0">
            <div className="relative overflow-hidden aspect-[3/4] rounded-xl">
              <Image
                src={product.image || 'https://placehold.co/600x800.png'}
                alt={product.name}
                fill
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                data-ai-hint={product.aiHint || "fashion product"}
              />
               {isDiscounted && (
                <Badge variant="offer" className="absolute top-3 left-3">
                  OFERTA
                </Badge>
              )}
              <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70">
                  <Heart className="h-4 w-4"/>
              </Button>
               <Button 
                variant="default"
                size="icon"
                className="absolute bottom-2 right-2 rounded-full h-9 w-9 shrink-0"
                disabled={product.stock <= 0}
                onClick={handleAddToCart}
                aria-label={`Añadir ${product.name} al carrito`}
              >
                <Plus className="h-5 w-5" />
            </Button>
            </div>
        </Card>
        <div className="pt-3 text-center">
            <h3 className="font-medium text-sm text-muted-foreground truncate">{product.name}</h3>
            <div className='flex items-baseline justify-center gap-2 mt-1'>
                <p className="text-md font-bold text-foreground">
                    {formatCurrency(product.price, currency.code)}
                </p>
                {isDiscounted && (
                    <p className="text-sm text-muted-foreground line-through">
                        {formatCurrency(product.originalPrice!, currency.code)}
                    </p>
                )}
            </div>
        </div>
      </Link>
    </div>
  );
}
