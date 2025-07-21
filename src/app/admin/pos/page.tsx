
'use client';

import * as React from 'react';
import { useProductsStore } from '@/hooks/use-products';
import { useCategoriesStore } from '@/hooks/use-categories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { PosCart } from '@/components/pos-cart';
import {
  Search,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePosCart } from '@/hooks/use-pos-cart';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth-store';

export default function PosPage() {
  const { products, isLoading: isLoadingProducts, fetchProducts } = useProductsStore();
  const { categories, isLoading: isLoadingCategories, fetchCategories } = useCategoriesStore();
  const { user } = useAuthStore();
  const { clearCart } = usePosCart();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  
  React.useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);


  const isLoading = isLoadingProducts || isLoadingCategories;

  const filteredProducts = React.useMemo(() => {
    let prods = products;

    if (selectedCategory !== 'all') {
        prods = prods.filter(p => p.category === selectedCategory);
    }
    
    if (searchQuery) {
      prods = prods.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return prods.filter(p => p.stock > 0);
  }, [products, selectedCategory, searchQuery]);
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-[1fr_400px] gap-6 overflow-hidden">
      {/* Main Content (Products Grid) */}
      <div className="flex flex-col gap-5 overflow-hidden">
        <header className="flex-shrink-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    <Button
                        key="all"
                        variant={selectedCategory === 'all' ? 'secondary' : 'outline'}
                        className={cn("h-11 rounded-lg px-4", selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card')}
                        onClick={() => setSelectedCategory('all')}
                      >
                        <span className='font-semibold'>All</span>
                    </Button>
                    {categories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={selectedCategory === cat.name ? 'secondary' : 'outline'}
                        className={cn("h-11 rounded-lg px-4", selectedCategory === cat.name ? 'bg-primary text-primary-foreground' : 'bg-card')}
                        onClick={() => setSelectedCategory(cat.name)}
                      >
                        <span className='font-semibold'>{cat.label}</span>
                      </Button>
                    ))}
                  </div>
                <div className="relative flex-grow max-w-sm">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                    placeholder="Search for food, coffee, etc.."
                    className="h-11 rounded-lg bg-card pl-11 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0 pt-4">
          <ScrollArea className="flex-1 -mx-3">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 px-3 pb-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
          </ScrollArea>
        </div>
      </div>

      {/* Cart Column */}
      <div className="w-[400px] p-0">
         <div className='h-full w-full rounded-lg'>
            <PosCart onCheckoutSuccess={clearCart} />
         </div>
      </div>
    </div>
  );
}
