
'use client';

import Image from 'next/image';
import type { Product } from '@/lib/products';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useCategoriesStore } from '@/hooks/use-categories';
import { useCurrencyStore } from '@/hooks/use-currency';

interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: Product;
  onAddToCart: (product: Product) => void;
  showDescription?: boolean;
  useLink?: boolean;
}

export function ProductCard({ 
  product, 
  className, 
  onAddToCart,
  showDescription = true,
  useLink = true,
  ...props 
}: ProductCardProps) {
  const { getCategoryByName } = useCategoriesStore();
  const stockStatus = product.stock <= 0 ? "Agotado" : product.stock < 10 ? "Poco Stock" : "En Stock";
  const { currency } = useCurrencyStore();
  
  const isDiscounted = product.originalPrice && product.originalPrice > product.price;

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault(); 
    e.stopPropagation();
    onAddToCart(product);
  }

  const category = getCategoryByName(product.category);

  const cardContent = (
      <Card className={cn(
          "flex flex-col overflow-hidden h-full", 
          isDiscounted && "border-offer",
          className
      )}>
        <CardHeader className="p-0 border-b relative overflow-hidden">
          <Image
            src={product.image || 'https://placehold.co/400x400.png'}
            alt={product.name}
            width={400}
            height={400}
            className="w-full h-auto object-cover aspect-square transition-transform duration-300 ease-in-out group-hover:scale-105"
            data-ai-hint={product.aiHint}
          />
          <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
            <Badge 
              className={cn(
                "w-fit",
                stockStatus === "Agotado" && "bg-destructive text-destructive-foreground",
                stockStatus === "Poco Stock" && "bg-amber-500 text-white"
              )}
            >
              {stockStatus}: {product.stock}
            </Badge>
          </div>
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            {isDiscounted && <Badge variant="offer">Oferta</Badge>}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col">
          {category && <Badge variant="outline" className="mb-2 w-fit text-xs">{category.label}</Badge>}
          <h4 className="font-bold text-md leading-tight flex-grow group-hover:text-primary transition-colors">{product.name}</h4>
          {showDescription && (
            <div className="h-10"> 
              {product.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.description}</p>}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 flex flex-col items-start gap-3 mt-auto">
          <Button 
            variant="outline" 
            className="w-full"
            disabled={product.stock <= 0}
            onClick={handleButtonClick}
          >
            <div className="flex items-center justify-center flex-wrap gap-x-2 w-full">
              <div className='flex items-center gap-2'>
                  <ShoppingCart className="h-4 w-4" />
                  <span>Añadir</span>
              </div>
              <div className="flex items-baseline gap-2">
                  <span className={cn("font-bold", isDiscounted && "text-offer")}>
                      {formatCurrency(product.price, currency.code)}
                  </span>
                  {isDiscounted && (
                      <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(product.originalPrice!, currency.code)}
                      </span>
                  )}
              </div>
            </div>
          </Button>
        </CardFooter>
      </Card>
  );

  const Wrapper = useLink 
    ? ({ children }: { children: React.ReactNode }) => <Link href={`/product/${product.id}`} className="group block h-full">{children}</Link>
    : ({ children }: { children: React.ReactNode }) => <div className="group block h-full cursor-pointer" onClick={() => onAddToCart(product)}>{children}</div>;


  return (
    <div {...props}>
      <Wrapper>
        {cardContent}
      </Wrapper>
    </div>
  );
}
