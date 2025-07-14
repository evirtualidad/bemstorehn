
'use client';

import { useProductsStore } from '@/hooks/use-products';
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/product-card';
import { Product } from '@/lib/products';

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  const { getProductById, products } = useProductsStore();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const product = getProductById(params.productId);

  if (!product) {
    notFound();
  }
  
  const stockStatus = product.stock <= 0 ? "Agotado" : product.stock < 10 ? "Poco Stock" : "En Stock";

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Añadido al carrito",
      description: `${product.name} ha sido añadido a tu carrito.`,
    });
  }

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Product Image */}
          <div className="relative aspect-square">
            <Image
              src={product.image || 'https://placehold.co/600x600.png'}
              alt={product.name}
              fill
              className="object-cover rounded-lg shadow-lg"
              data-ai-hint={product.aiHint}
            />
             <Badge 
              className={cn(
                "absolute top-4 right-4 text-lg",
                stockStatus === "Agotado" && "bg-destructive text-destructive-foreground",
                stockStatus === "Poco Stock" && "bg-amber-500 text-white"
              )}
            >
              {stockStatus}
            </Badge>
          </div>

          {/* Product Details */}
          <div className="flex flex-col gap-6">
            <div>
                <Badge variant="outline" className="mb-2 w-fit font-body text-md">{product.category}</Badge>
                <h1 className="text-4xl md:text-5xl font-headline text-primary">{product.name}</h1>
            </div>
            <p className="text-lg text-muted-foreground font-body leading-relaxed">
              {product.description}
            </p>
            <div className="flex items-center gap-4">
                <p className="text-4xl font-bold font-headline text-foreground">${product.price.toFixed(2)}</p>
            </div>
            <Button 
              size="lg"
              className="w-full md:w-auto font-body text-lg"
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-3 h-6 w-6" />
              Añadir al Carrito
            </Button>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <Separator className="my-12" />
            <h2 className="text-4xl md:text-5xl font-headline text-center mb-10 md:mb-14">También te podría interesar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {relatedProducts.map(related => (
                <ProductCard key={related.id} product={related as Product} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
