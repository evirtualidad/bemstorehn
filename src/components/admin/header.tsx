
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth-store';
import { usePosCart } from '@/hooks/use-pos-cart';
import { PosCart } from '@/components/pos-cart';

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
                <div className='flex items-center gap-6'>
                     <Link href="/admin/dashboard-v2" className="flex items-center gap-2">
                        <Leaf className="w-8 h-8 text-primary" />
                        <span className="text-xl font-bold">BEM STORE</span>
                     </Link>
                    <nav className='hidden md:flex items-center gap-2'>
                        {navItems.map((item) => {
                            if (item.role && item.role !== role) {
                                return null;
                            }
                            return (
                                <Button key={item.label} asChild variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'} size="sm">
                                    <Link href={item.href}>
                                        <item.icon className="h-4 w-4 mr-2" />
                                        {item.label}
                                    </Link>
                                </Button>
                            )
                        })}
                    </nav>
                </div>
                <div className='flex items-center gap-4'>
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
                    <div className='text-right'>
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
