
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
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
    Sun,
    Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth-store';
import { usePosCart } from '@/hooks/use-pos-cart';
import { PosCart } from '@/components/pos-cart';
import { useMobileSidebarStore } from '@/hooks/use-mobile-sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useTheme } from 'next-themes';
import { useOrdersStore } from '@/hooks/use-orders';
import { InstallPwaButton } from './install-pwa-button';
import { useLogoStore } from '@/hooks/use-logo-store';

const navItems = [
    { href: '/admin/dashboard-v2', label: 'Dashboard', icon: BarChart2 },
    { href: '/admin/pos', label: 'POS', icon: ShoppingBag },
    { href: '/admin/orders', label: 'Pedidos', icon: ListOrdered, id: 'orders' },
    { href: '/admin/inventory', label: 'Inventario', icon: Package, role: 'admin' },
    { href: '/admin/customers', label: 'Clientes', icon: Users2 },
    { href: '/admin/finance', label: 'Finanzas', icon: Building, role: 'admin' },
    { href: '/admin/settings', label: 'Ajustes', icon: Settings, role: 'admin'},
];

const ThemeToggleButton = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <div className="h-11 w-11" />; // Placeholder
    }

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-11 w-11 rounded-full">
            {theme === 'light' ? <Sun /> : <Moon />}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
};


export function AdminHeader() {
    const { user, role, logout } = useAuthStore();
    const { items, clearCart } = usePosCart();
    const { orders } = useOrdersStore();
    const { onOpen } = useMobileSidebarStore();
    const { logoUrl } = useLogoStore();
    const [isCartOpen, setIsCartOpen] = React.useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        await logout();
        router.push('/login');
    };
    
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    const handleCheckoutSuccess = () => {
        clearCart();
        setIsCartOpen(false);
    };

    const pendingApprovalCount = React.useMemo(() => {
        return orders.filter(order => order.status === 'pending-approval').length;
    }, [orders]);

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
                        {logoUrl ? (
                          <Image src={logoUrl} alt="BEM STORE HN Logo" width={160} height={160} className="object-contain h-12 w-auto" />
                        ) : (
                          <span className="text-xl font-bold">BEM STORE HN</span>
                        )}
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
                                                <div className="relative">
                                                    <Button asChild variant={'ghost'} size="icon" className={cn("h-11 w-11 rounded-full", isActive && "bg-primary/10")}>
                                                        <Link href={item.href} className='flex items-center'>
                                                            <item.icon className="h-5 w-5" />
                                                            <span className="sr-only">{item.label}</span>
                                                        </Link>
                                                    </Button>
                                                    {item.id === 'orders' && pendingApprovalCount > 0 && (
                                                        <div className="absolute top-0 right-0 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-muted">
                                                            {pendingApprovalCount}
                                                        </div>
                                                    )}
                                                </div>
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
                
                <div className='flex-shrink-0 flex items-center gap-2'>
                     <InstallPwaButton />
                     <ThemeToggleButton />
                     <Button variant="ghost" size="icon" onMouseDown={handleLogout} className="h-11 w-11 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/20 hover:text-destructive">
                         <LogOut className="h-5 w-5" />
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
