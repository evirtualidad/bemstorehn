
'use client';

import * as React from 'react';
import { useProductsStore } from '@/hooks/use-products';
import { useCategoriesStore } from '@/hooks/use-categories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import {
  Search,
  ListFilter,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { categoryIcons } from '@/components/admin/category-icons';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function PosPage() {
  const { products, isLoading: isLoadingProducts, fetchProducts } = useProductsStore();
  const { categories, isLoading: isLoadingCategories, fetchCategories } = useCategoriesStore();
  const { user } = useAuthStore();

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
    <div className="h-full flex flex-col gap-5 overflow-hidden">
      {/* Header section with Search and Categories */}
      <header className="flex-shrink-0">
        <div className="hidden sm:block">
          <h1 className='text-2xl font-bold mb-1'>Menu</h1>
          <p className="text-muted-foreground">Hola, {user?.email?.split('@')[0]}. ¡Felices ventas!</p>
        </div>
        <div className="flex items-center justify-between gap-4">
            <div className="relative flex-grow hidden sm:block">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por comida, café, etc.."
                className="h-12 rounded-lg bg-card pl-12 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-grow sm:hidden">
              <div className="flex items-center justify-between gap-2 p-1">
                  <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por comida, café, etc.."
                      className="h-12 rounded-lg bg-card pl-12 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className='h-12 w-12 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0'>
                            <ListFilter className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Categorías</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                            <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                            {categories.map((cat) => (
                              <DropdownMenuRadioItem key={cat.id} value={cat.name}>{cat.label}</DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
              </div>
            </div>
        </div>
        <div className="mt-6 hidden sm:flex flex-row flex-nowrap items-center gap-3 overflow-x-auto pb-2 -mx-2 px-2">
            <Card
                key="all"
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer border-2 min-w-[100px] h-24',
                  selectedCategory === 'all' ? 'border-primary bg-primary/10' : 'bg-card'
                )}
                onClick={() => setSelectedCategory('all')}
              >
                <span className='text-2xl mb-1'>🍽️</span>
                <span className='font-semibold text-sm'>Todos</span>
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
                    <span className='font-semibold text-sm text-center'>{cat.label}</span>
                  </Card>
                )
            })}
        </div>
      </header>
      
      {/* Products Grid */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </ScrollArea>
      </div>
    </div>
  );
}
