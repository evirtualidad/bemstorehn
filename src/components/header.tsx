'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLogoStore } from '@/hooks/use-logo-store';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { cn } from '@/lib/utils';

const BurgerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M4 12H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const ThemeToggleButton = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <div className="h-12 w-12" />; // Placeholder to avoid layout shift
    }

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-12 w-12 rounded-full">
            {theme === 'light' ? <Sun /> : <Moon />}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
};


export function Header() {
  const { logoUrl } = useLogoStore();
  const { items } = useCart();
  const totalCartItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="px-4 py-2 bg-background/80 backdrop-blur-sm sticky top-0 z-10 border-b">
      <div className="container mx-auto flex items-center justify-between gap-4 p-0">
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full">
            <BurgerIcon />
            <span className="sr-only">Menu</span>
        </Button>
        
        <div className="absolute left-1/2 -translate-x-1/2">
            {logoUrl && (
                <Image src={logoUrl} alt="Cosmetica Catalog Logo" width={100} height={40} className="object-contain h-10"/>
            )}
        </div>
        
        <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className={cn(
                'relative h-12 w-12 rounded-full hidden xl:inline-flex',
              )}
            >
              <Link href="/cart">
                <ShoppingCart className="h-6 w-6" />
                {totalCartItems > 0 && (
                    <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-background">
                        {totalCartItems}
                    </div>
                )}
                <span className="sr-only">Carrito de compras</span>
              </Link>
            </Button>

            <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
