'use client';

import { Home, ShoppingCart, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';

export function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();

  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout') || pathname.startsWith('/order-confirmation')) {
    return null;
  }
  
  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/cart', icon: ShoppingCart, label: 'Cart' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-16 bg-background/80 backdrop-blur-lg border rounded-full z-50 shadow-lg">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center text-muted-foreground transition-colors w-full h-full relative rounded-full',
                !isActive && 'hover:text-primary'
              )}
            >
              {isActive ? (
                <div className='flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-2'>
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-bold">{item.label}</span>
                </div>
              ) : (
                <item.icon className="w-6 h-6" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  );
}
