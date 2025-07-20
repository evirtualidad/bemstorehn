
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
      const categoryObject = categories.find((c) => c.id === selectedCategory);
      if (categoryObject) {
        prods = prods.filter((p) => p.category === categoryObject.name);
      }
    }

    if (searchQuery) {
      prods = prods.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return prods;
  }, [products, categories, selectedCategory, searchQuery]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <main className="flex-1 flex flex-col gap-4 overflow-y-auto pr-4 md:pr-[404px]">
        <header className="flex-shrink-0 pt-4">
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

        <div className="flex-shrink-0">
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
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  className="h-11 gap-2 rounded-lg px-4"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{cat.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
        
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      </main>

      {/* Cart Column */}
      <aside className="fixed right-0 top-0 hidden h-screen w-[380px] flex-shrink-0 flex-col border-l bg-card p-4 md:flex">
        <PosCart onCheckoutSuccess={clearCart} />
      </aside>
    </div>
  );
}
