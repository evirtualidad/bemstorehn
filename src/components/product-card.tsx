'use client';

import Image from 'next/image';
import type { Product } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { usePosCart } from '@/hooks/use-pos-cart';
import { usePathname } from 'next/navigation';
import { Badge } from './ui/badge';

interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: Product;
}

export function ProductCard({
  product,
  className,
  ...props
}: ProductCardProps) {
  const { currency } = useCurrencyStore();
  const { toast } = useToast();
  const pathname = usePathname();

  const isPos = pathname.startsWith('/admin/pos');
  const posAddToCart = usePosCart((state) => state.addToCart);
  const storeAddToCart = useCart((state) => state.addToCart);

  const handleAddToCartClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPos) {
      posAddToCart(product);
    } else {
      storeAddToCart(product);
      toast({
        title: 'Añadido al carrito',
        description: `${product.name} ha sido añadido a tu carrito.`,
      });
    }
  };
  
  const isDiscounted = product.original_price && product.original_price > product.price;

  const cardContent = (
      <div 
        className="flex h-full flex-col overflow-hidden rounded-xl bg-card border"
        onClick={isPos ? handleAddToCartClick : undefined}
      >
        <div className="relative overflow-hidden bg-secondary rounded-xl aspect-square">
            <Image
              src={product.image || 'https://placehold.co/400x400.png'}
              alt={product.name}
              width={400}
              height={400}
              className="w-full h-full rounded-md object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              data-ai-hint={product.aiHint}
            />
            {isDiscounted && (
                <Badge variant="offer" className="absolute top-3 left-3 bg-blue-500 text-white hover:bg-blue-500/90">
                    20% OFF
                </Badge>
            )}
        </div>
        <div className="flex flex-col p-3">
            <h3 className="flex-grow font-semibold leading-tight text-sm h-10">{product.name}</h3>
            <p className='text-xs text-muted-foreground'>{product.stock} Available • 12 sold</p>
            <div className='flex items-baseline gap-2 mt-2'>
                <p className="font-bold text-lg text-primary">
                    {formatCurrency(product.price, currency.code)}
                </p>
                {isDiscounted && (
                    <p className="text-sm text-muted-foreground line-through">
                        {formatCurrency(product.original_price!, currency.code)}
                    </p>
                )}
            </div>
        </div>
      </div>
  );

  if (!isPos) {
    return (
      <Link href={`/product/${product.id}`} className={cn('group', className)} {...props}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div {...props} className={cn('group cursor-pointer', className)}>
      {cardContent}
    </div>
  );
}
