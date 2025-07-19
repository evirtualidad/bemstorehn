'use client';

import { Home, Search, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';

export function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Do not show bottom nav on admin or checkout pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout') || pathname.startsWith('/order-confirmation')) {
    return null;
  }
  
  const navItems = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/search', icon: Search, label: 'Buscar' },
    { href: '/orders', icon: ShoppingBag, label: 'Pedidos' },
    { href: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center text-muted-foreground transition-colors w-full h-full',
              pathname === item.href && 'text-primary'
            )}
          >
            <div className="relative">
              <item.icon className="w-6 h-6" />
              {item.href === '/orders' && itemCount > 0 && (
                 <div className="absolute -top-1 -right-2 h-4 w-4 rounded-full flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {itemCount}
                </div>
              )}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
