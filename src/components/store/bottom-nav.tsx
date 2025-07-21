'use client';

import * as React from 'react';
import { Home, ShoppingCart, User, Percent } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/#deals', label: 'Deals', icon: Percent },
  { href: '/login', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const totalCartItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // Hide on admin pages or checkout
  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout') || pathname.startsWith('/order-confirmation')) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-2 md:hidden">
      <div className="bg-primary text-primary-foreground rounded-2xl p-2 flex items-center justify-around shadow-lg h-16">
        {navItems.map((item) => {
          const isActive = (pathname === '/' && item.href === '/') || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-center h-12 transition-all duration-300 ease-in-out relative',
                isActive ? 'bg-accent text-accent-foreground rounded-lg px-5 gap-2 font-bold' : 'text-primary-foreground/80 w-12'
              )}
            >
              <item.icon className="h-7 w-7 shrink-0" />
              {isActive && <span className="text-sm">{item.label}</span>}
              {item.href === '/cart' && totalCartItems > 0 && (
                 <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-primary">
                    {totalCartItems}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
