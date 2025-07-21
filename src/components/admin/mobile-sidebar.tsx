
'use client';

import React from 'react';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BarChart2,
    ListOrdered,
    Package,
    Users2,
    Building,
    Users,
    Settings,
    LogOut,
    ShoppingBag,
    Leaf
} from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useMobileSidebarStore } from '@/hooks/use-mobile-sidebar';

const navItems = [
    { href: '/admin/dashboard-v2', icon: BarChart2, label: 'Dashboard' },
    { href: '/admin/pos', icon: ShoppingBag, label: 'POS' },
    { href: '/admin/orders', icon: ListOrdered, label: 'Pedidos' },
    { href: '/admin/inventory', icon: Package, label: 'Inventario' },
    { href: '/admin/customers', icon: Users2, label: 'Clientes' },
    { href: '/admin/finance', icon: Building, label: 'Finanzas', role: 'admin' },
    { href: '/admin/users', icon: Users, label: 'Usuarios', role: 'admin' },
    { href: '/admin/settings', icon: Settings, label: 'Ajustes', role: 'admin'},
];

export function MobileSidebar() {
  const { isOpen, onClose } = useMobileSidebarStore();
  const pathname = usePathname();
  const { role } = useAuthStore();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="p-0 pt-6">
        <div className="flex flex-col h-full">
            <Link href="/admin/dashboard-v2" className="flex items-center gap-2 px-4 mb-6">
                <Leaf className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold">BEM STORE</span>
            </Link>
            <nav className="flex-1 flex flex-col gap-2 px-4">
                {navItems.map((item) => {
                    if (item.role && item.role !== role) {
                        return null;
                    }
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <SheetClose asChild key={item.label}>
                            <Button
                                asChild
                                variant={isActive ? 'secondary' : 'ghost'}
                                className="justify-start text-base"
                            >
                                <Link href={item.href}>
                                <item.icon className="mr-4 h-5 w-5" />
                                {item.label}
                                </Link>
                            </Button>
                        </SheetClose>
                    );
                })}
            </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
