'use client';

import { Home, Heart, ShoppingCart, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';

export function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout') || pathname.startsWith('/order-confirmation')) {
    return null;
  }
  
  const navItems = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/favorites', icon: Heart, label: 'Favoritos' },
    { href: '/cart', icon: ShoppingCart, label: 'Carrito' },
    { href: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-background/80 backdrop-blur-md border rounded-full z-50 shadow-lg">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center text-muted-foreground transition-colors w-full h-full relative',
                !isActive && 'hover:text-primary'
              )}
            >
              {isActive ? (
                <div className='flex items-center gap-2 bg-foreground text-background rounded-full px-4 py-2'>
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-bold">{item.label}</span>
                </div>
              ) : (
                <item.icon className="w-6 h-6" />
              )}
              {item.href === '/cart' && itemCount > 0 && !isActive && (
                 <div className="absolute top-0 right-3 h-4 w-4 rounded-full flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {itemCount}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  );
}
