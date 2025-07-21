
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Plus } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import type { Product } from '@/lib/types';
import Link from 'next/link';
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

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };
  
  return (
    <div {...props} className={cn("group", className)}>
       <Link href={`/product/${product.id}`} className="block">
        <Card className="overflow-hidden h-full border-none shadow-none rounded-2xl bg-secondary p-0">
            <div className="relative overflow-hidden aspect-square rounded-xl bg-card flex items-center justify-center">
              <Image
                src={product.image || 'https://placehold.co/400x400.png'}
                alt={product.name}
                width={150}
                height={150}
                className="w-full h-full object-contain transition-transform duration-300 ease-in-out group-hover:scale-105 p-4"
                data-ai-hint={product.aiHint || "fashion product"}
              />
               <Button 
                variant="default"
                size="icon"
                className="absolute bottom-2 right-2 rounded-full h-9 w-9 shrink-0"
                disabled={product.stock <= 0}
                onClick={handleAddToCart}
                aria-label={`Add ${product.name} to cart`}
              >
                <Plus className="h-5 w-5" />
            </Button>
            </div>
        </Card>
        <div className="pt-3">
            <h3 className="font-bold text-sm text-foreground truncate">{product.name}</h3>
            <div className='flex items-baseline justify-start gap-2 mt-1'>
                <p className="text-md font-bold text-foreground">
                    {formatCurrency(product.price, currency.code)}
                </p>
            </div>
        </div>
      </Link>
    </div>
  );
}
