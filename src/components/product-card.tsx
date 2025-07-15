
'use client';

import Image from 'next/image';
import type { Product } from '@/lib/products';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Tag } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useCategoriesStore } from '@/hooks/use-categories';
import { useCurrencyStore } from '@/hooks/use-currency';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { getCategoryByName } = useCategoriesStore();
  const stockStatus = product.stock <= 0 ? "Agotado" : product.stock < 10 ? "Poco Stock" : "En Stock";
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { currency } = useCurrencyStore();
  
  const isDiscounted = product.specialCategory === 'descuento' && product.originalPrice && product.originalPrice > product.price;
  const isPromotion = product.specialCategory === 'promocion';

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault(); // Prevent link navigation when clicking the button
    addToCart(product);
    toast({
      title: "Añadido al carrito",
      description: `${product.name} ha sido añadido a tu carrito.`,
    });
  }

  const category = getCategoryByName(product.category);

  return (
    <Link href={`/product/${product.id}`} className="group block h-full">
      <Card className={cn(
          "flex flex-col overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 animate-in fade-in-0 slide-in-from-bottom-5 ease-in-out h-full", 
          isDiscounted && "border-2 border-primary",
          isPromotion && "border-2 border-accent-foreground",
          className
      )}>
        <CardHeader className="p-0 border-b relative">
          <Image
            src={product.image || 'https://placehold.co/400x400.png'}
            alt={product.name}
            width={400}
            height={400}
            className="w-full h-auto object-cover aspect-square"
            data-ai-hint={product.aiHint}
          />
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            {isDiscounted && (
                <Badge variant="destructive" className="text-md font-bold uppercase"><Tag className="mr-1 h-4 w-4" /> Descuento</Badge>
            )}
            {isPromotion && (
                <Badge className="bg-accent-foreground text-white text-md font-bold uppercase"><Star className="mr-1 h-4 w-4" /> Promoción</Badge>
            )}
            <Badge 
              className={cn(
                "w-fit",
                stockStatus === "Agotado" && "bg-destructive text-destructive-foreground",
                stockStatus === "Poco Stock" && "bg-amber-500 text-white"
              )}
            >
              {stockStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col">
          {category && <Badge variant="outline" className="mb-2 w-fit">{category.label}</Badge>}
          <h4 className="font-bold text-xl leading-tight flex-grow group-hover:text-primary transition-colors">{product.name}</h4>
          {product.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.description}</p>}
        </CardContent>
        <CardFooter className="p-4 pt-0 flex flex-col items-start gap-4 mt-auto">
          <div className="flex flex-col items-start w-full">
             {isDiscounted ? (
              <div className='flex items-baseline gap-2'>
                <p className="text-3xl font-bold text-destructive">{formatCurrency(product.price, currency.code)}</p>
                <p className="text-lg font-medium text-muted-foreground line-through">{formatCurrency(product.originalPrice!, currency.code)}</p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-foreground">{formatCurrency(product.price, currency.code)}</p>
            )}
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            disabled={product.stock <= 0}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Añadir al Carrito
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
