
'use client';

import * as React from 'react';
import { useProductsStore } from '@/hooks/use-products';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Minus, Plus, Heart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProductHeader } from '@/components/product-header';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId as string;

  const { getProductById, isLoading: isLoadingProducts, fetchProducts } = useProductsStore();
  const addToCart = useCart.getState().addToCart;
  const { toast } = useToast();
  const { currency } = useCurrencyStore();
  
  const [quantity, setQuantity] = React.useState(1);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const product = getProductById(productId);

  if (isLoadingProducts) {
    return (
        <div className="bg-background min-h-screen">
          <div className="flex-1 flex items-center justify-center h-screen">
            <LoadingSpinner />
          </div>
        </div>
    );
  }

  if (!product) {
    notFound();
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
        addToCart(product);
    }
    toast({
      title: "Añadido al carrito",
      description: `${quantity} x ${product.name} ha sido añadido a tu carrito.`,
    });
  }
  
  return (
    <div className="bg-muted min-h-screen">
      <ProductHeader />
      
      {/* Main content */}
      <div>
        {/* Product Image Section */}
        <div className="relative w-full h-[60vh] flex-shrink-0">
          <Image
              src={product.image || 'https://placehold.co/600x600.png'}
              alt={product.name}
              fill
              className="object-cover"
              data-ai-hint={product.aiHint}
          />
          <div className="absolute bottom-4 right-4">
              <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full shadow-md bg-white hover:bg-gray-100 text-black">
                  <Heart />
              </Button>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="bg-card rounded-t-3xl z-10 relative -mt-5 p-6">
          <div className="flex justify-between items-start">
              <div>
                  <h1 className="text-2xl font-bold">{product.name}</h1>
              </div>
              <div className="flex items-center gap-3 bg-secondary p-1 rounded-full">
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                      <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-bold w-5 text-center">{quantity}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setQuantity(q => q + 1)}>
                      <Plus className="h-4 w-4" />
                  </Button>
              </div>
          </div>
          
          <div className='mt-5 mb-2'>
              <h2 className="text-lg font-bold">Description</h2>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
              {product.description}
          </p>
        </div>
      </div>

      {/* Fixed Footer Panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-card p-4 border-t z-20">
        <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Price</p>
              <p className="text-2xl font-bold">{formatCurrency(product.price * quantity, currency.code)}</p>
          </div>
          <Button 
            size="lg"
            className="w-full max-w-xs h-14 rounded-full text-md"
            disabled={product.stock <= 0}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-3 h-5 w-5" />
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
}
