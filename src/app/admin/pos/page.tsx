
'use client';

import * as React from 'react';
import { useProductsStore } from '@/hooks/use-products';
import { useCategoriesStore } from '@/hooks/use-categories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductCard } from '@/components/product-card';
import { PosCart } from '@/components/pos-cart';
import {
  Search,
  Shirt,
  Sparkles,
  Gem,
  Scissors,
  Bone,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePosCart } from '@/hooks/use-pos-cart';

const categoryIcons: { [key: string]: React.ElementType } = {
  skincare: Sparkles,
  makeup: Gem,
  hair: Scissors,
  body: Bone,
  default: Shirt,
};

const getIconForCategory = (categoryName: string) => {
  return categoryIcons[categoryName] || categoryIcons.default;
};

export default function PosPage() {
  const { products, isLoading: isLoadingProducts, fetchProducts } = useProductsStore();
  const { categories, isLoading: isLoadingCategories, fetchCategories } = useCategoriesStore();
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
      const categoryObject = categories.find((c) => c.name === selectedCategory);
      if (categoryObject) {
        prods = prods.filter((p) => p.category === categoryObject.name);
      }
    }

    if (searchQuery) {
      prods = prods.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return prods.filter(p => p.stock > 0);
  }, [products, categories, selectedCategory, searchQuery]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh_-_9rem)] grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 overflow-hidden">
      {/* Main Content (Products Grid) */}
      <main className="flex flex-col gap-4 overflow-y-auto">
        <header className="flex-shrink-0 pt-4 px-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              className="h-12 rounded-lg bg-background pl-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="flex-shrink-0 px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="h-11 rounded-lg px-6"
              onClick={() => setSelectedCategory('all')}
            >
              Todos
            </Button>
            {categories.map((cat) => {
              const Icon = getIconForCategory(cat.name);
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.name ? 'default' : 'outline'}
                  className="h-11 gap-2 rounded-lg px-4"
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{cat.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
        
        <ScrollArea className="flex-1">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 px-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </ScrollArea>
      </main>

      {/* Cart Column */}
      <div className="hidden lg:block w-[380px] pr-4 pb-4">
         <div className='h-full w-full'>
            <PosCart onCheckoutSuccess={clearCart} />
         </div>
      </div>
    </div>
  );
}
