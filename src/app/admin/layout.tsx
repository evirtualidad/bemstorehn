
'use client';

import Link from 'next/link';
import {
  Bell,
  CircleUser,
  Home,
  ImageIcon,
  LineChart,
  Menu,
  Package,
  Package2,
  ShoppingCart,
  Tablet,
  Tag,
  Users,
  Archive,
  Coins,
  XCircle,
  Settings,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as React from 'react';
import { useOrdersStore } from '@/hooks/use-orders';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function CurrencySelector() {
    const { currency, currencies, setCurrency } = useCurrencyStore();

    const handleCurrencyChange = (currencyCode: string) => {
        const newCurrency = currencies.find(c => c.code === currencyCode);
        if (newCurrency) {
            setCurrency(newCurrency);
        }
    };

    return (
        <Select value={currency.code} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-auto h-9 text-xs">
                <SelectValue placeholder="Moneda" />
            </SelectTrigger>
            <SelectContent>
                {currencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { orders } = useOrdersStore();

  const pendingApprovalCount = React.useMemo(() => {
    return orders.filter(o => o.status === 'pending-approval').length;
  }, [orders]);

  const navItems = [
    { href: '/admin/dashboard', icon: Home, label: 'Panel' },
    { href: '/admin/pos', icon: Tablet, label: 'POS' },
    { href: '/admin/orders', icon: ShoppingCart, label: 'Pedidos', badge: pendingApprovalCount > 0 ? pendingApprovalCount : null },
    { href: '/admin/inventory', icon: Archive, label: 'Inventario' },
    { href: '/admin/finance', icon: Coins, label: 'Finanzas' },
    { href: '/admin/customers', icon: Users, label: 'Clientes' },
    { href: '/admin/analytics', icon: LineChart, label: 'Analíticas' },
    { href: '/admin/settings', icon: Settings, label: 'Ajustes' },
  ];

  const DesktopNavItem = ({ item }: { item: any }) => {
    const isActive = pathname.startsWith(item.href);
    return (
     <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant={isActive ? 'secondary' : 'ghost'}
            className="justify-center md:justify-start relative w-10 h-10 md:w-auto"
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5 md:mr-2" />
              <span className="hidden md:inline">{item.label}</span>
               {item.badge && (
                <Badge className="absolute -top-2 -right-2 md:static md:ml-auto w-6 h-6 md:w-auto md:h-auto flex items-center justify-center">
                  {item.badge}
                </Badge>
              )}
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="md:hidden">
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
     </TooltipProvider>
    )
  };
  
  const MobileNavItem = ({ item }: { item: any }) => {
    const isActive = pathname.startsWith(item.href);
    return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground',
        isActive && 'bg-muted text-foreground'
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
      {item.badge && (
        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          {item.badge}
        </Badge>
      )}
    </Link>
    )
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="hidden font-medium sm:flex sm:flex-row sm:items-center sm:gap-5 sm:text-sm lg:gap-6">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 font-semibold text-lg md:text-base text-foreground"
          >
            <Package2 className="h-6 w-6" />
            <span className="whitespace-nowrap hidden md:inline">BEM STORE HN</span>
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <DesktopNavItem key={item.label} item={item} />
            ))}
          </div>
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 sm:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Alternar menú de navegación</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader className='sr-only'>
                <SheetTitle>Menú Principal</SheetTitle>
            </SheetHeader>
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold mb-4"
              >
                <Package2 className="h-6 w-6" />
                <span className="whitespace-nowrap">BEM STORE HN</span>
              </Link>
              {navItems.map((item) => (
                <MobileNavItem key={item.label} item={item} />
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex items-center gap-4">
             <CurrencySelector />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Alternar menú de usuario</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Configuración</DropdownMenuItem>
              <DropdownMenuItem>Soporte</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
