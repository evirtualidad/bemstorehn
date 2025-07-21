
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { categoryIcons } from '@/components/admin/category-icons';
import { Card } from '@/components/ui/card';

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
             <h1 className='text-2xl font-bold'>Menu</h1>
             <div className="relative flex-grow max-w-sm">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                placeholder="Search for food, coffe, etc.."
                className="h-11 rounded-lg bg-card pl-11 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
            <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-2">
              <Card
                  key="all"
                  className={cn(
                    'flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer border-2 min-w-[100px] h-24',
                    selectedCategory === 'all' ? 'border-primary bg-primary/10' : 'bg-card'
                  )}
                  onClick={() => setSelectedCategory('all')}
                >
                  <span className='text-2xl mb-1'>🍽️</span>
                  <span className='font-semibold text-sm'>All</span>
              </Card>
              {categories.map((cat) => {
                  const Icon = categoryIcons[cat.name as keyof typeof categoryIcons] || categoryIcons.default;
                  return (
                    <Card
                      key={cat.id}
                      className={cn(
                        'flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer border-2 min-w-[100px] h-24',
                        selectedCategory === cat.name ? 'border-primary bg-primary/10' : 'bg-card'
                      )}
                      onClick={() => setSelectedCategory(cat.name)}
                    >
                      <Icon className="h-6 w-6 mb-1 text-primary" />
                      <span className='font-semibold text-sm'>{cat.label}</span>
                    </Card>
                  )
              })}
            </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0 pt-4">
          <ScrollArea className="flex-1 -mx-3">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5 px-3 pb-4">
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
