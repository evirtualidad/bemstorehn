
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ThemeProvider } from '@/components/theme-provider';
import Link from 'next/link';
import { Home, ListOrdered, Package, ShoppingBag, Users2, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const navItems = [
    { href: '/admin/dashboard-v2', icon: Home, label: 'Home' },
    { href: '/admin/pos', icon: ShoppingBag, label: 'POS' },
    { href: '/admin/orders', icon: ListOrdered, label: 'Orders' },
    { href: '/admin/inventory', icon: Package, label: 'Products' },
    { href: '/admin/customers', icon: Users2, label: 'Customers' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
];


function AdminHeader() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    return (
        <header className='flex items-center justify-between p-4 border-b bg-background'>
            <div className='flex items-center gap-2'>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" rx="8" fill="hsl(var(--primary))"/>
                </svg>
                <h1 className='text-xl font-bold'>Resto</h1>
            </div>
            <nav className='flex items-center gap-2 bg-card p-1 rounded-lg'>
                {navItems.map(item => (
                    <Link key={item.href} href={item.href} className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        pathname.startsWith(item.href) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
            <div className='flex items-center gap-4'>
                <div className='text-right'>
                    <p className='font-semibold'>{user?.email}</p>
                    <p className='text-xs text-muted-foreground'>{user?.role}</p>
                </div>
                <Image
                    src="https://placehold.co/40x40.png"
                    alt="user avatar"
                    width={40}
                    height={40}
                    className='rounded-full'
                    data-ai-hint="man avatar"
                />
            </div>
        </header>
    )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthLoading, initializeSession } = useAuthStore();
  const router = useRouter();

  React.useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  React.useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
        <div className="flex flex-col h-screen bg-muted/40">
            <AdminHeader />
            <main className="flex-1 overflow-y-auto p-6">
                {children}
            </main>
        </div>
    </ThemeProvider>
  );
}

