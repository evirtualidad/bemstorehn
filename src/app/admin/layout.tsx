
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/dashboard', icon: Home, label: 'Panel' },
    { href: '/admin/pos', icon: Tablet, label: 'Punto de Venta' },
    { href: '/admin/orders', icon: ShoppingCart, label: 'Pedidos', badge: '6' },
    { href: '/admin/products', icon: Package, label: 'Productos' },
    { href: '/admin/categories', icon: Tag, label: 'Categorías' },
    { href: '/admin/customers', icon: Users, label: 'Clientes' },
    { href: '/admin/analytics', icon: LineChart, label: 'Analíticas' },
    { href: '/admin/banners', icon: ImageIcon, label: 'Banners' },
  ];

  const DesktopNavItem = ({ item }: { item: typeof navItems[0] }) => (
    <Link
        href={item.href}
        className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-foreground',
            pathname.startsWith(item.href) ? 'bg-muted text-foreground' : 'text-muted-foreground'
        )}
    >
        <item.icon className="h-4 w-4" />
        {item.label}
        {item.badge && (
            <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                {item.badge}
            </Badge>
        )}
    </Link>
  );

  const MobileNavItem = ({ item }: { item: typeof navItems[0] }) => (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground',
        pathname.startsWith(item.href) && 'bg-muted text-foreground'
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
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="hidden font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 font-semibold text-lg md:text-base text-foreground"
          >
            <Package2 className="h-6 w-6" />
            <span className="sr-only">Admin Cosmetica</span>
          </Link>
          {navItems.map((item) => (
             <DesktopNavItem key={item.label} item={item} />
          ))}
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
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
                <span>Admin Cosmetica</span>
              </Link>
              {navItems.map((item) => (
                <MobileNavItem key={item.label} item={item} />
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
             {/* You can add a search bar here if needed */}
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
