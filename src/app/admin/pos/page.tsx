
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
  ShoppingBag,
  Bone,
  Scissors,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePosCart } from '@/hooks/use-pos-cart';
import type { Product, Category } from '@/lib/types';

// Map category names to icons
const categoryIcons: { [key: string]: React.ElementType } = {
  skincare: Sparkles,
  makeup: Gem,
  hair: Scissors,
  body: Bone,
  default: Shirt, // Fallback icon
};

const getIconForCategory = (categoryName: string) => {
  return categoryIcons[categoryName] || categoryIcons.default;
};

export default function PosPage() {
  const { products, isLoading: isLoadingProducts } = useProductsStore();
  const { categories, isLoading: isLoadingCategories } = useCategoriesStore();
  const { clearCart } = usePosCart();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');

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
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_auto]">
      {/* Main Content (Products Grid) */}
      <div className="flex flex-col overflow-hidden">
        <header className="flex-shrink-0 border-b p-4">
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
        <div className="flex-shrink-0 overflow-x-auto border-b p-4">
          <div className="flex items-center gap-2">
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
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 p-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Column */}
      <aside className="hidden w-[380px] flex-col border-l bg-card lg:flex">
        <PosCart onCheckoutSuccess={clearCart} />
      </aside>
    </div>
  );
}
