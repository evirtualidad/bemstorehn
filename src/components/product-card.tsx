
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
import { Card, CardContent } from './ui/card';

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
        className={cn("flex flex-col h-full overflow-hidden rounded-xl border group cursor-pointer", className)}
        onClick={isPos ? handleAddToCartClick : undefined}
        {...props}
      >
        <div className="relative w-full aspect-square overflow-hidden">
            <Image
              src={product.image || 'https://placehold.co/400x400.png'}
              alt={product.name}
              fill
              className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              data-ai-hint={product.aiHint}
            />
        </div>
        <CardContent className="p-4 flex flex-col flex-1">
            <h3 className="font-semibold leading-tight text-sm line-clamp-2 flex-grow">{product.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {product.description}
            </p>
            <div className="flex items-end justify-between mt-3">
                <span className="font-bold text-lg text-foreground">
                    {formatCurrency(product.price, currency.code)}
                </span>
                 <Button
                    size="icon"
                    className="w-9 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 flex-shrink-0"
                    onClick={handleAddToCartClick}
                    aria-label={`Añadir ${product.name} al carrito`}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
            </div>
        </CardContent>
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
