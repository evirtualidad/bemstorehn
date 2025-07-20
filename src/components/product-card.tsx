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

  const cardContent = (
      <div 
        className="flex h-full flex-col overflow-hidden rounded-xl bg-card"
        onClick={isPos ? handleAddToCartClick : undefined}
      >
        <div className="relative overflow-hidden bg-secondary rounded-xl">
            <Image
              src={product.image || 'https://placehold.co/400x500.png'}
              alt={product.name}
              width={400}
              height={500}
              className="aspect-square w-full rounded-md object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              data-ai-hint={product.aiHint}
            />
        </div>
        <div className="flex flex-col p-2 text-center mt-2">
            <h3 className="flex-grow font-semibold leading-tight text-sm">{product.name}</h3>
            <div className='flex items-center justify-between mt-2'>
              <p className="font-bold text-sm">
                  {formatCurrency(product.price, currency.code)}
              </p>
              <Button
                  size="icon"
                  className="h-8 w-8 rounded-lg text-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={product.stock <= 0}
                  onClick={handleAddToCartClick}
                  aria-label={`Añadir ${product.name} al carrito`}
              >
                  <Plus className="h-4 w-4" />
              </Button>
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
