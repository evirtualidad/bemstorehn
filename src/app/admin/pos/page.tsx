
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
  LayoutGrid,
  ListFilter
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePosCart } from '@/hooks/use-pos-cart';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/hooks/use-auth-store';
import { categoryIcons } from '@/components/admin/category-icons';

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
    <div className="grid h-full grid-cols-[1fr_auto] gap-6 overflow-hidden">
      {/* Main Content (Products Grid) */}
      <div className="flex flex-col gap-5 overflow-hidden">
        <header className="flex-shrink-0">
            <div className="flex items-center justify-between">
                <div>
                  <h1 className='text-2xl font-bold'>Productos</h1>
                  <p className='text-sm text-muted-foreground'>{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric'})}</p>
                </div>
                <div className="relative flex-grow max-w-lg">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                    placeholder="Buscar producto..."
                    className="h-11 rounded-lg bg-card pl-11 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </header>
        
        <Separator />

        <div className="flex-shrink-0 space-y-4">
          <h3 className="text-xl font-bold">Categorías</h3>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <Button
                key="all"
                variant={selectedCategory === 'all' ? 'secondary' : 'outline'}
                className={cn("h-auto rounded-lg p-3 flex flex-col items-center justify-center gap-2 border-2", selectedCategory === 'all' ? 'border-primary bg-accent' : 'bg-card')}
                onClick={() => setSelectedCategory('all')}
              >
                <LayoutGrid className={cn("h-7 w-7", selectedCategory === 'all' ? 'text-primary' : 'text-muted-foreground')} />
                <span className='font-semibold text-sm'>Todos</span>
            </Button>
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.name as keyof typeof categoryIcons] || categoryIcons.default;
              return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.name ? 'secondary' : 'outline'}
                className={cn("h-auto rounded-lg p-3 flex flex-col items-center justify-center gap-2 border-2", selectedCategory === cat.name ? 'border-primary bg-accent' : 'bg-card')}
                onClick={() => setSelectedCategory(cat.name)}
              >
                <Icon className={cn("h-7 w-7", selectedCategory === cat.name ? 'text-primary' : 'text-muted-foreground')} />
                <span className='font-semibold text-sm'>{cat.label}</span>
              </Button>
            )})}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className='flex items-center justify-between mb-4'>
             <h3 className="text-xl font-bold">Seleccionar Producto</h3>
             <Button variant='outline' className='bg-card'>
                <ListFilter className="mr-2 h-4 w-4" /> Filtrar
             </Button>
          </div>
          <ScrollArea className="flex-1 -mx-2">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5 px-2 pb-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
          </ScrollArea>
        </div>
      </div>

      {/* Cart Column */}
      <div className="w-[360px] p-0">
         <div className='h-full w-full bg-card rounded-lg'>
            <PosCart onCheckoutSuccess={clearCart} />
         </div>
      </div>
    </div>
  );
}
