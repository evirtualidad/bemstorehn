
'use client';

import * as React from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth-store';

const navItems = [
    { href: '/admin/dashboard-v2', icon: BarChart2, label: 'Dashboard' },
    { href: '/admin/pos', icon: ShoppingBag, label: 'Punto de Venta' },
    { href: '/admin/orders', icon: ListOrdered, label: 'Pedidos' },
    { href: '/admin/inventory', icon: Package, label: 'Inventario' },
    { href: '/admin/customers', icon: Users2, label: 'Clientes' },
    { href: '/admin/finance', icon: Building, label: 'Finanzas', role: 'admin' },
    { href: '/admin/users', icon: Users, label: 'Usuarios', role: 'admin' },
];

const bottomNavItems = [
    { href: '/admin/settings', icon: Settings, label: 'Ajustes', role: 'admin'},
    { href: '/login', icon: LogOut, label: 'Cerrar Sesión' }
];

export function AdminSidebar() {
    const pathname = usePathname();
    const { logout, role } = useAuthStore();

    const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        logout();
    };

    return (
        <aside className="h-full bg-card flex flex-col items-center justify-between py-5 px-3 border-r">
            <div className="flex flex-col items-center gap-5">
                 <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" rx="8" fill="hsl(var(--primary))"/>
                 </svg>
                <nav className="flex flex-col items-center gap-4">
                    {navItems.map((item) => {
                        if (item.role && item.role !== role) {
                            return null;
                        }
                        return (
                            <Link key={item.label} href={item.href}>
                                <Button
                                    variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className={cn("rounded-lg h-11 w-11", pathname.startsWith(item.href) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                                    title={item.label}
                                >
                                    <item.icon className="h-6 w-6" />
                                </Button>
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div className="flex flex-col items-center gap-4">
                {bottomNavItems.map((item) => {
                    if (item.role && item.role !== role) {
                            return null;
                    }
                    const isLogout = item.label === 'Cerrar Sesión';
                    return (
                        <Link key={item.label} href={item.href} onClick={isLogout ? handleLogout : undefined}>
                            <Button
                                variant={'ghost'}
                                size="icon"
                                className="rounded-lg h-11 w-11 text-muted-foreground"
                                title={item.label}
                            >
                                <item.icon className="h-6 w-6" />
                            </Button>
                        </Link>
                    )
                })}
            </div>
        </aside>
    )
}
