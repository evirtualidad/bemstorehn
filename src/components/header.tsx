
'use client';

import { Leaf, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { Badge } from '@/components/ui/badge';
import { useCategoriesStore } from '@/hooks/use-categories';

interface HeaderProps {
    selectedCategory: string | null;
    onSelectCategory: (category: string | null) => void;
}

export function Header({ selectedCategory, onSelectCategory }: HeaderProps) {
  const { categories } = useCategoriesStore();
  
  const { items, toggleCart } = useCart();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="py-4 px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b border-border/40">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3" onClick={() => onSelectCategory(null)}>
            <Leaf className="w-8 h-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-wide">
              Cosmetica
            </h1>
          </Link>
          <nav className="hidden md:flex items-center gap-2 text-md">
            {categories.map((category) => (
              <Button 
                asChild 
                variant={selectedCategory === category.name ? 'secondary' : 'ghost'} 
                key={category.id}
                onClick={() => onSelectCategory(category.name)}
               >
                <Link href={`#`}>
                  {category.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="relative rounded-full h-12 w-12" onClick={toggleCart}>
            {itemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center p-0"
              >
                {itemCount}
              </Badge>
            )}
            <ShoppingCart className="w-7 h-7" />
            <span className="sr-only">Carrito de Compras</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
