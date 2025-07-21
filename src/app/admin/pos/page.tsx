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
  Clock,
  ListOrdered,
  LogOut,
  ListFilter,
  User,
  Coffee,
  IceCream,
  Pizza,
  Sandwich
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePosCart } from '@/hooks/use-pos-cart';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/hooks/use-auth-store';

const navItems = [
  { href: '/admin/dashboard-v2', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/admin/pos', icon: Coffee, label: 'POS' },
  { href: '/admin/orders', icon: ListOrdered, label: 'Orders' },
  { href: '#', icon: Clock, label: 'History' },
];

const bottomNavItems = [
    { href: '/login', icon: LogOut, label: 'Logout' }
];

const categoryIcons = {
    'skincare': Coffee,
    'makeup': IceCream,
    'hair': Pizza,
    'body': Sandwich,
    'default': Coffee,
}

const OrangeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="hsl(var(--primary))"/>
    </svg>
)

function Sidebar() {
    const pathname = '/admin/pos'; // Hardcoded for now to show active state
    return (
        <aside className="h-full bg-card flex flex-col items-center justify-between py-5 px-3">
            <div className="flex flex-col items-center gap-5">
                <OrangeIcon />
                 <TooltipProvider>
                    <nav className="flex flex-col items-center gap-4">
                        {navItems.map((item) => (
                             <Tooltip key={item.label}>
                                <TooltipTrigger asChild>
                                    <Link href={item.href}>
                                        <Button
                                            variant={pathname === item.href ? 'secondary' : 'ghost'}
                                            size="icon"
                                            className={cn("rounded-lg h-11 w-11", pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground')}
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
                                        className="rounded-lg h-11 w-11 text-muted-foreground"
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
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="grid h-screen grid-cols-[auto_1fr_auto] gap-0 bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content (Products Grid) */}
      <main className="flex flex-col gap-5 overflow-y-auto p-6">
        <header className="flex-shrink-0">
            <div className="flex items-center justify-between">
                <div className="relative flex-grow max-w-lg">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                    placeholder="Search menu..."
                    className="h-11 rounded-lg bg-card pl-11 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className='flex items-center gap-4'>
                   <div className='text-right'>
                        <p className='font-bold'>BEM Store</p>
                        <p className='text-sm text-muted-foreground'>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric'})}</p>
                   </div>
                   <Avatar>
                        <AvatarImage src='https://github.com/shadcn.png' alt='user' />
                        <AvatarFallback>
                            {user?.email?.[0].toUpperCase()}
                        </AvatarFallback>
                   </Avatar>
                </div>
            </div>
        </header>
        
        <Separator />

        <div className="flex-shrink-0 space-y-4">
          <h3 className="text-xl font-bold">Categories</h3>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <Button
                key="all"
                variant={selectedCategory === 'all' ? 'secondary' : 'outline'}
                className={cn("h-auto rounded-lg p-3 flex flex-col items-center justify-center gap-2 border-2", selectedCategory === 'all' ? 'border-primary bg-accent' : 'bg-card')}
                onClick={() => setSelectedCategory('all')}
              >
                <LayoutGrid className={cn("h-7 w-7", selectedCategory === 'all' ? 'text-primary' : 'text-muted-foreground')} />
                <span className='font-semibold text-sm'>All Items</span>
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
             <h3 className="text-xl font-bold">Select Menu</h3>
             <Button variant='outline' className='bg-card'>
                <ListFilter className="mr-2 h-4 w-4" /> Filter
             </Button>
          </div>
          <ScrollArea className="flex-1 -mx-2">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5 px-2 pb-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
          </ScrollArea>
        </div>
      </main>

      {/* Cart Column */}
      <div className="w-[380px] p-6 bg-card border-l">
         <div className='h-full w-full'>
            <PosCart onCheckoutSuccess={clearCart} />
         </div>
      </div>
    </div>
  );
}
