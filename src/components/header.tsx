
'use client';

import { Leaf, ShoppingCart, Percent } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { Badge } from '@/components/ui/badge';
import { useCategoriesStore } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface HeaderProps {
    selectedCategory?: string | null;
    onSelectCategory?: (category: string | null) => void;
    hasOfferProducts?: boolean;
}

export function Header({ selectedCategory, onSelectCategory, hasOfferProducts }: HeaderProps) {
  const { categories } = useCategoriesStore();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  const { items, toggleCart } = useCart();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  
  const handleCategoryClick = (category: string | null) => {
    if(onSelectCategory) {
        onSelectCategory(category)
    }
  }

  return (
    <header className="py-4 px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b border-border/40">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex items-center gap-2" onClick={() => handleCategoryClick(null)}>
            <Leaf className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-wide">
              BEM STORE HN
            </h1>
          </Link>
           {isHomePage && (
            <nav className="hidden md:flex items-center gap-2 text-md">
              {hasOfferProducts && (
                  <Button
                      variant={selectedCategory === '__offers__' ? 'secondary' : 'ghost'}
                      onClick={() => handleCategoryClick('__offers__')}
                      className={cn(
                          "h-10 px-4",
                          selectedCategory === '__offers__' ? "border-offer text-offer" : "text-offer"
                      )}
                  >
                      <Percent className="mr-2 h-4 w-4" />
                      Ofertas
                  </Button>
              )}
              {categories.map((category) => (
                <Button 
                  variant={selectedCategory === category.name ? 'secondary' : 'ghost'} 
                  key={category.id}
                  onClick={() => handleCategoryClick(category.name)}
                  className="h-10 px-4"
                 >
                    {category.label}
                </Button>
              ))}
            </nav>
           )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="relative rounded-full h-10 w-10 md:h-12 md:w-12" onClick={toggleCart}>
            {itemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 md:h-6 md:w-6 rounded-full flex items-center justify-center p-0 text-xs"
              >
                {itemCount}
              </Badge>
            )}
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
            <span className="sr-only">Carrito de Compras</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

    