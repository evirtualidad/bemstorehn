
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
import { Card } from './ui/card';

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
      <Card 
        className={cn("flex items-center gap-4 p-3 overflow-hidden rounded-xl border group cursor-pointer", className)}
        onClick={isPos ? handleAddToCartClick : undefined}
        {...props}
      >
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
            <Image
              src={product.image || 'https://placehold.co/400x400.png'}
              alt={product.name}
              fill
              className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              data-ai-hint={product.aiHint}
            />
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="font-semibold leading-tight text-sm truncate">{product.name}</h3>
            <p className="font-bold text-lg text-foreground mt-1">
                {formatCurrency(product.price, currency.code)}
            </p>
        </div>
         <Button
            size="icon"
            className="w-10 h-10 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex-shrink-0"
            onClick={isPos ? handleAddToCartClick : undefined}
          >
            <Plus className="h-5 w-5" />
          </Button>
      </Card>
  );

  if (!isPos) {
    return (
      <Link href={`/product/${product.id}`} className={cn('group', className)} {...props}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
