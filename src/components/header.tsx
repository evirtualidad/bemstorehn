import { Leaf, ShoppingCart, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { products } from '@/lib/products';

export function Header() {
  const categories = [...new Set(products.map(p => p.category))];

  return (
    <header className="py-4 px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/40">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-headline text-foreground tracking-wide">
              Cosmetica
            </h1>
          </Link>
          <nav className="hidden md:flex items-center gap-6 font-body text-md">
            {categories.map(category => (
              <Link key={category} href={`#`} className="hover:text-primary transition-colors">
                {category}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon">
            <User className="w-6 h-6" />
            <span className="sr-only">Account</span>
          </Button>
          <Button variant="ghost" size="icon">
            <ShoppingCart className="w-6 h-6" />
            <span className="sr-only">Shopping Cart</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
