
'use client';

import { Menu, CircleUser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import Image from 'next/image';

export function Header() {
  const { toggleCart } = useCart();

  return (
    <header className="px-4 pt-4 pb-2 bg-background">
      <div className="container mx-auto flex items-center justify-between gap-4 p-0">
        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-2">
            <Menu className="w-6 h-6" />
            <span className="sr-only">Menu</span>
        </Button>
        <div className="h-12 w-[120px] bg-secondary rounded-lg flex items-center justify-center text-muted-foreground">
            Logo
        </div>
        <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-full" onClick={toggleCart}>
            <Image 
                src="https://placehold.co/48x48.png" 
                alt="User Avatar"
                width={48}
                height={48}
                className="rounded-full"
                data-ai-hint="woman avatar"
            />
        </Button>
      </div>
    </header>
  );
}
