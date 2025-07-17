
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
import { cn, formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/product-card';
import { Product } from '@/lib/products';
import { useCategoriesStore } from '@/hooks/use-categories';
import { useCurrencyStore } from '@/hooks/use-currency';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import * as React from 'react';

interface ProductDetailPageProps {
    params: {
        productId: string;
    }
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = params;
  const { getProductById, products, fetchProducts, isLoading: isLoadingProducts } = useProductsStore();
  const { getCategoryByName, fetchCategories, isLoading: isLoadingCategories } = useCategoriesStore();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { currency } = useCurrencyStore();
  
  React.useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);
  
  const product = getProductById(productId);
  const isLoading = isLoadingProducts || isLoadingCategories;

  if (isLoading) {
    return (
        <div className="bg-background min-h-screen">
          <Header />
          <div className="flex-1 flex items-center justify-center h-[50vh]">
            <LoadingSpinner />
          </div>
        </div>
    );
  }

  if (!product) {
    notFound();
  }

  const category = getCategoryByName(product.category);
  
  const stockStatus = product.stock <= 0 ? "Agotado" : product.stock < 10 ? "Poco Stock" : "En Stock";
  const isDiscounted = product.originalPrice && product.originalPrice > product.price;

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
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Product Image */}
          <div className="relative aspect-square">
            <Image
              src={product.image || 'https://placehold.co/600x600.png'}
              alt={product.name}
              fill
              className="object-cover rounded-lg shadow-lg"
              data-ai-hint={product.aiHint}
            />
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {isDiscounted && <Badge variant="offer" className="text-md md:text-lg">Oferta</Badge>}
              <Badge 
                className={cn(
                  "text-md md:text-lg",
                  stockStatus === "Agotado" && "bg-destructive text-destructive-foreground",
                  stockStatus === "Poco Stock" && "bg-amber-500 text-white"
                )}
              >
                {stockStatus}
              </Badge>
            </div>
          </div>

          {/* Product Details */}
          <div className="flex flex-col gap-6">
            <div>
                {category && <Badge variant="outline" className="mb-2 w-fit text-sm md:text-md">{category.label}</Badge>}
                <h1 className="text-3xl md:text-4xl font-bold text-primary">{product.name}</h1>
            </div>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {product.description}
            </p>
            <div className="flex items-baseline gap-4">
                <p className={cn("font-bold", isDiscounted ? "text-3xl md:text-4xl text-offer" : "text-3xl md:text-4xl text-foreground")}>
                    {formatCurrency(product.price, currency.code)}
                </p>
                 {isDiscounted && (
                    <p className="text-xl md:text-2xl text-muted-foreground line-through">
                        {formatCurrency(product.originalPrice!, currency.code)}
                    </p>
                )}
            </div>
            <Button 
              size="lg"
              className="w-full md:w-auto text-md md:text-lg py-6"
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-3 h-5 w-5" />
              Añadir al Carrito
            </Button>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 md:mt-20">
            <Separator className="my-12" />
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-14">También te podría interesar</h2>
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
