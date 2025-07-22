
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
    Settings,
    LogOut,
    ShoppingBag,
    Leaf,
    ShoppingCart,
    Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth-store';
import { usePosCart } from '@/hooks/use-pos-cart';
import { PosCart } from '@/components/pos-cart';
import { useMobileSidebarStore } from '@/hooks/use-mobile-sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const navItems = [
    { href: '/admin/dashboard-v2', icon: BarChart2, label: 'Dashboard' },
    { href: '/admin/pos', icon: ShoppingBag, label: 'POS' },
    { href: '/admin/orders', icon: ListOrdered, label: 'Pedidos' },
    { href: '/admin/inventory', icon: Package, label: 'Inventario' },
    { href: '/admin/customers', icon: Users2, label: 'Clientes' },
    { href: '/admin/finance', icon: Building, label: 'Finanzas', role: 'admin' },
    { href: '/admin/settings', icon: Settings, label: 'Ajustes', role: 'admin'},
];

export function AdminHeader() {
    const { user, role, logout } = useAuthStore();
    const { items, clearCart } = usePosCart();
    const { onOpen } = useMobileSidebarStore();
    const [isCartOpen, setIsCartOpen] = React.useState(false);
    const pathname = usePathname();

    const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        logout();
    };
    
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    const handleCheckoutSuccess = () => {
        clearCart();
        setIsCartOpen(false);
    };

    return (
        <>
            <header className='flex items-center justify-between p-4 border-b bg-card'>
                <div className="flex-shrink-0 flex items-center gap-4">
                     <div className="md:hidden">
                        <Button onClick={onOpen} variant="ghost" size="icon">
                            <Menu />
                        </Button>
                    </div>
                     <Link href="/admin/dashboard-v2" className="flex items-center gap-2">
                        <Leaf className="w-8 h-8 text-primary" />
                        <span className="text-xl font-bold hidden md:inline-block">BEM STORE</span>
                     </Link>
                </div>
                
                <nav className='flex-1 justify-center hidden md:flex'>
                    <div className='bg-muted p-1 rounded-full'>
                        <TooltipProvider>
                            <div className='flex items-center gap-2'>
                                {navItems.map((item) => {
                                    if (item.role && item.role !== role) {
                                        return null;
                                    }
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <Tooltip key={item.label} delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                    <Button asChild variant={'ghost'} size="icon" className={cn("h-11 w-11 rounded-full", isActive && "bg-primary/10")}>
                                                    <Link href={item.href} className='flex items-center'>
                                                        <item.icon className="h-5 w-5" />
                                                        <span className="sr-only">{item.label}</span>
                                                    </Link>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                                <p>{item.label}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                })}
                            </div>
                        </TooltipProvider>
                    </div>
                </nav>
                
                <div className='flex-shrink-0 flex items-center gap-4'>
                     <Button asChild variant="ghost" size="icon" onClick={handleLogout} className="h-11 w-11 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/20 hover:text-destructive">
                         <Link href="/login">
                            <LogOut className="h-5 w-5" />
                        </Link>
                     </Button>
                </div>
            </header>
            <PosCart
                isOpen={isCartOpen}
                onOpenChange={setIsCartOpen}
                onCheckoutSuccess={handleCheckoutSuccess}
            />
        </>
    )
}
