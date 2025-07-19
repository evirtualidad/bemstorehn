
'use client';

import * as React from 'react';
import { Home, ShoppingCart, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { Badge } from '../ui/badge';

export function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: totalItems },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];
  
  const shouldHideNav = pathname.startsWith('/admin') || pathname.startsWith('/checkout') || pathname.startsWith('/order-confirmation') || pathname.startsWith('/product');

  if (shouldHideNav) {
    return null;
  }
  
  if (!isClient) {
    return <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background border-t rounded-t-2xl z-50" />;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/90 backdrop-blur-lg border-t rounded-t-2xl z-50">
      <div className="flex justify-around items-center h-full px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center text-muted-foreground transition-colors h-full w-full'
              )}
            >
              {isActive ? (
                <div className='flex items-center justify-start bg-gray-200 text-secondary-foreground rounded-full px-2 py-2 w-full max-w-[120px]'>
                  <div className="bg-primary text-primary-foreground rounded-full p-1.5 mr-2">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{item.label}</span>
                </div>
              ) : (
                <>
                  <item.icon className="w-6 h-6 text-foreground" />
                   {item.badge && item.badge > 0 ? (
                    <Badge variant="destructive" className="absolute top-2 right-6 rounded-full h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                      {item.badge}
                    </Badge>
                  ) : null}
                </>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  );
}
