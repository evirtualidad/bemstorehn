
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
    { href: '/admin/users', icon: Users, label: 'Usuarios', role: 'admin' },
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
                
                <nav className='flex-1 justify-center hidden md:flex items-center gap-4'>
                    <TooltipProvider>
                        {navItems.map((item) => {
                            if (item.role && item.role !== role) {
                                return null;
                            }
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Tooltip key={item.label} delayDuration={0}>
                                    <TooltipTrigger asChild>
                                            <Button asChild variant={'ghost'} size="sm" className={cn("h-9 justify-start md:px-3", isActive && "bg-primary/10")}>
                                            <Link href={item.href} className='flex items-center'>
                                                <item.icon className="h-4 w-4" />
                                                <span className="hidden 2xl:inline-block 2xl:ml-2">{item.label}</span>
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className='2xl:hidden'>
                                        <p>{item.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </TooltipProvider>
                </nav>
                
                <div className='flex-shrink-0 flex items-center gap-4'>
                    <div className='relative'>
                        <Button
                            variant="outline"
                            size="icon"
                            className='rounded-lg'
                            onClick={() => setIsCartOpen(true)}
                        >
                            <ShoppingCart className="h-5 w-5" />
                        </Button>
                        {totalItems > 0 && (
                            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-background">
                                {totalItems}
                            </div>
                        )}
                    </div>
                    <div className='text-right hidden sm:block'>
                        <p className='font-semibold'>{user?.email}</p>
                        <p className='text-xs text-muted-foreground'>{user?.role}</p>
                    </div>
                     <Button asChild variant="ghost" size="icon" onClick={handleLogout}>
                         <Link href="/login">
                            <LogOut className="h-5 w-5 text-muted-foreground" />
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
