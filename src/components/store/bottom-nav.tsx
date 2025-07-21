
'use client';

import * as React from 'react';
import { Home, ShoppingCart, User, Percent } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/#deals', label: 'Deals', icon: Percent },
  { href: '/login', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
      <div className="bg-primary text-primary-foreground rounded-full p-2 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const isActive = (pathname === '/' && item.href === '/') || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-center gap-2 rounded-full px-4 py-2 transition-colors duration-200',
                isActive ? 'bg-primary-foreground text-primary' : 'text-primary-foreground/70 hover:bg-primary-foreground/10'
              )}
            >
              <item.icon className="h-5 w-5" />
              {isActive && <span className="text-sm font-bold">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
