
'use client';

import {
  Activity,
  ArrowUpRight,
  DollarSign,
  Users,
  Package,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import React from 'react';
import { useProductsStore } from '@/hooks/use-products';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useOrdersStore } from '@/hooks/use-orders';
import { useCustomersStore } from '@/hooks/use-customers';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { parseISO } from 'date-fns/parseISO';


export default function Dashboard() {
  const { products, isHydrated: productsHydrated } = useProductsStore();
  const { orders, isHydrated: ordersHydrated } = useOrdersStore();
  const { customers, isHydrated: customersHydrated } = useCustomersStore();
  const { currency } = useCurrencyStore();

  const isHydrated = productsHydrated && ordersHydrated && customersHydrated;

  const {
    totalRevenue,
    totalOrders,
    activeProducts,
    totalSales,
    salesData,
    newClientsData,
    recentTransactions
  } = React.useMemo(() => {
    if (!isHydrated) return { totalRevenue: 0, totalOrders: 0, activeProducts: 0, totalSales: 0, salesData: [], newClientsData: [], recentTransactions: [] };

    const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = nonCancelledOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = nonCancelledOrders.length;
    const activeProducts = products.filter(p => p.stock > 0).length;
    const totalSales = nonCancelledOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    const salesByDay = nonCancelledOrders.reduce((acc, order) => {
        const day = format(parseISO(order.date), 'yyyy-MM-dd');
        acc[day] = (acc[day] || 0) + order.total;
        return acc;
    }, {} as Record<string, number>);

    const last30Days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date()
    });

    const salesData = last30Days.map(date => {
        const dayString = format(date, 'yyyy-MM-dd');
        return {
            name: format(date, 'd MMM', { locale: es }),
            sales: salesByDay[dayString] || 0
        };
    });

    const newClientsByMonth = customers.reduce((acc, customer) => {
        // This is a simplification. A real app would store the customer creation date.
        // For now, we'll distribute them over the last 6 months for visualization.
        const monthIndex = parseInt(customer.id.slice(-2)) % 6; // pseudo-random month
        const monthDate = subDays(new Date(), monthIndex * 30);
        const monthName = format(monthDate, 'MMM', { locale: es });
        acc[monthName] = (acc[monthName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const last6Months = Array.from({ length: 6 }, (_, i) => subDays(new Date(), i * 30))
        .map(d => format(d, 'MMM', { locale: es }))
        .reverse();

    const newClientsData = last6Months.map(month => ({
        month: month,
        clients: newClientsByMonth[month] || 0
    }));
    
    const recentTransactions = [...nonCancelledOrders]
      .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .slice(0, 5);


    return { totalRevenue, totalOrders, activeProducts, totalSales, salesData, newClientsData, recentTransactions };
  }, [isHydrated, orders, products, customers]);
  
  const getInitials = (name?: string) => {
    if (!name || name.trim() === '') return 'CF';
    const names = name.split(' ').filter(Boolean);
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const statusConfig = {
    'pending-approval': { label: 'Pendiente', variant: 'outline' as const },
    'pending-payment': { label: 'Pendiente', variant: 'outline' as const },
    'paid': { label: 'Aprobado', variant: 'default' as const },
    'cancelled': { label: 'Cancelado', variant: 'destructive' as const },
  };

  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  return (
    <main className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue, currency.code)}</div>
            <p className="text-xs text-muted-foreground">
              Total facturado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalOrders.toLocaleString('es-ES')}</div>
            <p className="text-xs text-muted-foreground">
              Pedidos no cancelados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              de {products.length} productos totales
            </p>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Registrados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de clientes
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Rendimiento de Ventas</CardTitle>
            <CardDescription>
                Ingresos de los últimos 30 días.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => formatCurrency(value, currency.code, 0)}/>
                <Tooltip 
                    cursor={{fill: 'hsl(var(--accent))', radius: '0.25rem' }}
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderRadius: '0.5rem',
                        border: '1px solid hsl(var(--border))',
                    }}
                    formatter={(value: number) => [formatCurrency(value, currency.code), 'Ventas']}
                />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nuevos Clientes</CardTitle>
             <CardDescription>
                Crecimiento de clientes este año.
            </CardDescription>
          </CardHeader>
          <CardContent className='pl-2'>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={newClientsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <Tooltip 
                    cursor={{fill: 'hsl(var(--accent))', radius: '0.25rem' }}
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderRadius: '0.5rem',
                        border: '1px solid hsl(var(--border))',
                    }}
                />
                <defs>
                    <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="clients" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorClients)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
         <Card>
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
            <CardDescription>
              Las últimas ventas de tu tienda.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {recentTransactions.slice(0,4).map(order => (
                <div key={order.id} className="flex items-center gap-4">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarFallback>{getInitials(order.customer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">
                        {order.customer.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                        {order.customer.phone}
                        </p>
                    </div>
                    <div className="ml-auto font-medium">{formatCurrency(order.total, currency.code)}</div>
                </div>
            ))}
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Transacciones Recientes</CardTitle>
              <CardDescription>
                Últimas transacciones de tu tienda.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/admin/orders">
                Ver Todo
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Tipo
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Estado
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Fecha
                  </TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map(order => {
                    const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || { label: 'Cancelado', variant: 'destructive' as const };
                    return (
                        <TableRow key={order.id}>
                            <TableCell>
                                <div className="font-medium">{order.customer.name}</div>
                                <div className="hidden text-sm text-muted-foreground md:inline">
                                    {order.id}
                                </div>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                                <Badge variant="outline">{order.source === 'pos' ? 'POS' : 'Tienda Online'}</Badge>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                                <Badge className="text-xs" variant={statusInfo.variant}>
                                {statusInfo.label}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell lg:hidden xl:table-cell">
                                {format(parseISO(order.date), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(order.total, currency.code)}</TableCell>
                        </TableRow>
                    )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
