
'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
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

interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: Product;
  onAddToCart?: (product: Product) => void;
  useLink?: boolean;
}

export function ProductCard({ 
  product, 
  className, 
  onAddToCart,
  useLink = true,
  ...props 
}: ProductCardProps) {
  const { currency } = useCurrencyStore();
  const { toast } = useToast();
  const pathname = usePathname();
  
  // Decide which cart to use based on the context (POS or Storefront)
  const isPos = pathname.startsWith('/admin/pos');
  const posAddToCart = usePosCart(state => state.addToCart);
  const storeAddToCart = useCart(state => state.addToCart);

  const isDiscounted = product.original_price && product.original_price > product.price;

  const handleAddToCartClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAddToCart) {
        onAddToCart(product);
        return;
    }

    if (isPos) {
        posAddToCart(product);
    } else {
        storeAddToCart(product);
        toast({
          title: "Añadido al carrito",
          description: `${product.name} ha sido añadido a tu carrito.`,
        });
    }
  };
  
  const CardContent = () => (
    <Card className="flex flex-col overflow-hidden h-full border-0 shadow-none rounded-lg bg-secondary">
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
        <div className="p-4 pt-0 flex-grow flex flex-col">
        <h3 className="font-semibold text-sm leading-tight h-10 line-clamp-2">{product.name}</h3>
        <div className="flex items-end justify-between mt-2">
            <div className="flex flex-col">
                <p className={cn("text-lg font-bold text-foreground", isDiscounted && "text-destructive")}>
                    {formatCurrency(product.price, currency.code)}
                </p>
                {isDiscounted && (
                    <p className="text-xs text-muted-foreground line-through">
                        {formatCurrency(product.original_price!, currency.code)}
                    </p>
                )}
            </div>
            <Button 
                variant="default"
                size="icon"
                className="rounded-full h-9 w-9 shrink-0"
                disabled={product.stock <= 0}
                onClick={handleAddToCartClick}
                aria-label={`Añadir ${product.name} al carrito`}
            >
                <Plus className="h-5 w-5" />
            </Button>
        </div>
        </div>
    </Card>
  );

  return (
    <div 
      {...props} 
      className={cn("group", className)}
      onClick={useLink ? undefined : (e) => handleAddToCartClick(e)}
      style={!useLink ? { cursor: 'pointer' } : {}}
    >
        {useLink ? (
             <Link href={`/product/${product.id}`} className="block">
                <CardContent />
             </Link>
        ) : (
            <CardContent />
        )}
    </div>
  );
}
