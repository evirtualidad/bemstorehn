'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import type { Product } from '@/lib/types';
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
  
  return (
    <div {...props} className={cn("group", className)}>
       <Link href={`/product/${product.id}`} className="block">
        <Card className="overflow-hidden h-full border-0 shadow-none rounded-2xl bg-secondary p-0">
            <div className="relative overflow-hidden aspect-[4/5] rounded-xl">
              <Image
                src={product.image || 'https://placehold.co/600x800.png'}
                alt={product.name}
                fill
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                data-ai-hint={product.aiHint || "fashion product"}
              />
              <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background">
                  <Heart className="h-4 w-4"/>
              </Button>
            </div>
        </Card>
        <div className="pt-2">
            <h3 className="font-bold text-base leading-tight truncate">{product.name}</h3>
        </div>
      </Link>
    </div>
  );
}
