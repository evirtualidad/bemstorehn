import Image from 'next/image';
import type { Product } from '@/lib/products';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <Card className={cn("flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-in fade-in-0 slide-in-from-bottom-5 ease-in-out", className)}>
      <CardHeader className="p-0 border-b">
        <Image
          src={product.image}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-auto object-cover aspect-square"
          data-ai-hint={product.aiHint}
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <Badge variant="outline" className="mb-2 w-fit font-body">{product.category}</Badge>
        <h4 className="font-headline text-xl leading-tight flex-grow">{product.name}</h4>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <p className="text-2xl font-bold font-headline text-primary">${product.price.toFixed(2)}</p>
        <Button variant="outline" size="icon">
          <ShoppingCart />
          <span className="sr-only">Add to cart</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
