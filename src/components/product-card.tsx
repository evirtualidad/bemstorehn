
'use client';

import Image from 'next/image';
import type { Product } from '@/lib/products';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const stockStatus = product.stock <= 0 ? "Agotado" : product.stock < 10 ? "Poco Stock" : "En Stock";
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Añadido al carrito",
      description: `${product.name} ha sido añadido a tu carrito.`,
    });
  }

  return (
    <Card className={cn("flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-in fade-in-0 slide-in-from-bottom-5 ease-in-out group", className)}>
      <CardHeader className="p-0 border-b relative">
        <Image
          src={product.image || 'https://placehold.co/400x400.png'}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-auto object-cover aspect-square"
          data-ai-hint={product.aiHint}
        />
        <Badge 
          className={cn(
            "absolute top-3 right-3",
            stockStatus === "Agotado" && "bg-destructive text-destructive-foreground",
            stockStatus === "Poco Stock" && "bg-amber-500 text-white"
          )}
        >
          {stockStatus}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        {product.category && <Badge variant="outline" className="mb-2 w-fit font-body">{product.category}</Badge>}
        <h4 className="font-headline text-xl leading-tight flex-grow group-hover:text-primary transition-colors">{product.name}</h4>
        {product.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2 font-body">{product.description}</p>}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col items-start gap-4">
        <p className="text-2xl font-bold font-headline text-foreground">${product.price.toFixed(2)}</p>
        <Button 
          variant="outline" 
          className="w-full font-body"
          disabled={product.stock <= 0}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Añadir al Carrito
        </Button>
      </CardFooter>
    </Card>
  );
}
