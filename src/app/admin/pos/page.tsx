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
  Home,
  LayoutGrid,
  Bookmark,
  ShoppingCart,
  MessageSquare,
  Settings,
  LogOut,
  ListFilter,
  ChevronDown
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePosCart } from '@/hooks/use-pos-cart';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { href: '#', icon: Home, label: 'Home' },
  { href: '/admin/pos', icon: LayoutGrid, label: 'Products' },
  { href: '#', icon: Bookmark, label: 'Saved' },
  { href: '#', icon: ShoppingCart, label: 'Cart' },
  { href: '#', icon: MessageSquare, label: 'Messages' },
];

const bottomNavItems = [
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
    { href: '/login', icon: LogOut, label: 'Logout' }
];

function Sidebar() {
    return (
        <aside className="h-full bg-card flex flex-col items-center justify-between p-4">
            <div className="flex flex-col items-center gap-6">
                <div className="bg-primary text-primary-foreground h-12 w-12 flex items-center justify-center rounded-full text-2xl font-bold">
                    C
                </div>
                 <TooltipProvider>
                    <nav className="flex flex-col items-center gap-4">
                        {navItems.map((item) => (
                             <Tooltip key={item.label}>
                                <TooltipTrigger asChild>
                                    <Link href={item.href}>
                                        <Button
                                            variant={item.href === '/admin/pos' ? 'default' : 'ghost'}
                                            size="icon"
                                            className={cn("rounded-lg h-12 w-12", item.href === '/admin/pos' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                                        >
                                            <item.icon className="h-6 w-6" />
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </nav>
                 </TooltipProvider>
            </div>
             <TooltipProvider>
                <div className="flex flex-col items-center gap-4">
                    {bottomNavItems.map((item) => (
                         <Tooltip key={item.label}>
                            <TooltipTrigger asChild>
                                <Link href={item.href}>
                                    <Button
                                        variant={'ghost'}
                                        size="icon"
                                        className="rounded-lg h-12 w-12 text-muted-foreground"
                                    >
                                        <item.icon className="h-6 w-6" />
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>{item.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </TooltipProvider>
        </aside>
    )
}

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

    const categoryMap: { [key: string]: string } = {
        'all': 'Desserts',
        'skincare': 'Cakes',
        'makeup': 'Pastry',
        'hair': 'Ice Cream',
        'body': 'Pancakes'
    };

    if (selectedCategory !== 'all') {
        prods = prods.filter(p => p.category === selectedCategory);
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

  const categoryButtons = [
      { id: 'skincare', label: 'Cakes' },
      { id: 'makeup', label: 'Pastry' },
      { id: 'hair', label: 'Ice Cream' },
      { id: 'body', label: 'Pancakes' }
  ]

  return (
    <div className="grid h-screen grid-cols-[auto_1fr_auto] gap-0 bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content (Products Grid) */}
      <main className="flex flex-col gap-6 overflow-y-auto px-8 py-6">
        <header className="flex-shrink-0">
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="text-2xl font-bold p-0 h-auto">
                    Items <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
            </div>
            <div className="flex items-center gap-4 mt-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                    placeholder="Search..."
                    className="h-12 rounded-lg bg-card pl-12 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-lg bg-card border-border">
                    <ListFilter />
                </Button>
            </div>
        </header>

        <div className="flex-shrink-0">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {categoryButtons.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'secondary'}
                className={cn("h-11 rounded-lg px-6 font-semibold", selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground')}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
        
        <ScrollArea className="flex-1 -mx-2">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6 px-2 pb-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </ScrollArea>
      </main>

      {/* Cart Column */}
      <div className="w-[380px] p-6 bg-card">
         <div className='h-full w-full'>
            <PosCart onCheckoutSuccess={clearCart} />
         </div>
      </div>
    </div>
  );
}
