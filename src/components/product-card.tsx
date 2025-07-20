
'use client';

import Image from 'next/image';
import type { Product } from '@/lib/products';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { usePosCart } from '@/hooks/use-pos-cart';
import { usePathname } from 'next/navigation';
import { useCategoriesStore } from '@/hooks/use-categories';

interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: Product;
  useLink?: boolean;
}

export function ProductCard({
  product,
  className,
  useLink = true,
  ...props
}: ProductCardProps) {
  const { currency } = useCurrencyStore();
  const { toast } = useToast();
  const pathname = usePathname();
  const { getCategoryByName } = useCategoriesStore();

  const isPos = pathname.startsWith('/admin/pos');
  const posAddToCart = usePosCart((state) => state.addToCart);
  const storeAddToCart = useCart((state) => state.addToCart);

  const category = getCategoryByName(product.category);

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

  const CardContent = () => (
    <Card
      className="flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border bg-card shadow-none"
      onClick={isPos ? handleAddToCartClick : undefined}
    >
      <div className="relative overflow-hidden bg-secondary/50 p-2">
        <Badge
          variant="stock"
          className={cn(
            'absolute left-2 top-2 z-10',
            product.stock <= 0
              ? 'bg-red-500/80 text-white'
              : product.stock < 10
                ? 'bg-amber-400/80 text-black'
                : 'bg-green-500/80 text-white'
          )}
        >
          En Stock: {product.stock}
        </Badge>
        <Image
          src={product.image || 'https://placehold.co/400x500.png'}
          alt={product.name}
          width={400}
          height={500}
          className="aspect-[4/5] w-full rounded-md object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          data-ai-hint={product.aiHint}
        />
      </div>
      <div className="flex flex-grow flex-col p-3">
        {category && (
          <Badge variant="outline" className="mb-2 w-fit">
            {category.label}
          </Badge>
        )}
        <h3 className="flex-grow font-semibold leading-tight line-clamp-2">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <div className="mt-3">
          <Button
            className="h-10 w-full rounded-lg text-sm font-bold"
            disabled={product.stock <= 0}
            onClick={handleAddToCartClick}
            aria-label={`Añadir ${product.name} al carrito`}
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir {formatCurrency(product.price, currency.code)}
          </Button>
        </div>
      </div>
    </Card>
  );

  const cardElement = <CardContent />;

  if (!isPos && useLink) {
    return (
      <Link href={`/product/${product.id}`} className={cn('group', className)} {...props}>
        {cardElement}
      </Link>
    );
  }

  return (
    <div {...props} className={cn('group', className)}>
      {cardElement}
    </div>
  );
}
