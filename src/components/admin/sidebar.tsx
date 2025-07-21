
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutGrid,
    ListOrdered,
    Package,
    Users,
    Settings,
    LogOut,
    ShoppingBag,
    Users2,
    BarChart2,
    Building,
    Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth-store';

const OrangeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="hsl(var(--primary))"/>
    </svg>
);

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
                <OrangeIcon />
                <TooltipProvider>
                    <nav className="flex flex-col items-center gap-4">
                        {navItems.map((item) => {
                            if (item.role && item.role !== role) {
                                return null;
                            }
                            return (
                                <Tooltip key={item.label}>
                                    <TooltipTrigger asChild>
                                        <Link href={item.href}>
                                            <Button
                                                variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                                                size="icon"
                                                className={cn("rounded-lg h-11 w-11", pathname.startsWith(item.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground')}
                                            >
                                                <item.icon className="h-6 w-6" />
                                            </Button>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p>{item.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </nav>
                </TooltipProvider>
            </div>
            <TooltipProvider>
                <div className="flex flex-col items-center gap-4">
                    {bottomNavItems.map((item) => {
                        if (item.role && item.role !== role) {
                                return null;
                        }
                        const isLogout = item.label === 'Cerrar Sesión';
                        return (
                            <Tooltip key={item.label}>
                                <TooltipTrigger asChild>
                                    <Link href={item.href} onClick={isLogout ? handleLogout : undefined}>
                                        <Button
                                            variant={'ghost'}
                                            size="icon"
                                            className="rounded-lg h-11 w-11 text-muted-foreground"
                                        >
                                            <item.icon className="h-6 w-6" />
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>
            </TooltipProvider>
        </aside>
    )
}
