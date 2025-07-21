
'use client';

import * as React from 'react';
import {
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
  Archive,
} from 'lucide-react';

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
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { useOrdersStore } from '@/hooks/use-orders';
import { useProductsStore } from '@/hooks/use-products';
import { useCustomersStore } from '@/hooks/use-customers';
import { formatCurrency, cn } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import { format, subDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DashboardV2() {
  const { orders, isLoading: isLoadingOrders } = useOrdersStore();
  const { products, isLoading: isLoadingProducts } = useProductsStore();
  const { customers, isLoading: isLoadingCustomers } = useCustomersStore();
  const { currency } = useCurrencyStore();
  
  const isLoading = isLoadingOrders || isLoadingProducts || isLoadingCustomers;

  const dashboardData = React.useMemo(() => {
    if (isLoading) return null;

    const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'pending-approval');

    const totalRevenue = nonCancelledOrders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = nonCancelledOrders.length;
    const activeProducts = products.filter((p) => p.stock > 0).length;
    const totalCustomers = customers.length;
    
    const salesLast7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        return {
            date: format(date, 'MMM d', { locale: es }),
            total: 0,
        };
    }).reverse();

    const sevenDaysAgo = startOfDay(subDays(new Date(), 6));

    nonCancelledOrders.forEach(order => {
        const orderDate = new Date(order.created_at);
        if (orderDate >= sevenDaysAgo) {
            const dateStr = format(orderDate, 'MMM d', { locale: es });
            const dayData = salesLast7Days.find(d => d.date === dateStr);
            if (dayData) {
                dayData.total += order.total;
            }
        }
    });

    const productSales = new Map<string, { product: any; quantity: number; revenue: number }>();
    nonCancelledOrders.forEach(order => {
      order.items.forEach(item => {
        const existingProduct = products.find(p => p.id === item.id);
        if (existingProduct) { 
          const entry = productSales.get(item.id);
          if (entry) {
            entry.quantity += item.quantity;
            entry.revenue += item.price * item.quantity;
          } else {
            productSales.set(item.id, {
              product: existingProduct,
              quantity: item.quantity,
              revenue: item.price * item.quantity,
            });
          }
        }
      });
    });

    const topSellingProducts = [...productSales.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      activeProducts,
      totalCustomers,
      salesLast7Days,
      recentTransactions: nonCancelledOrders.slice(0, 5),
      topSellingProducts,
    };
  }, [isLoading, orders, products, customers, currency.code]);

  if (isLoading || !dashboardData) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const {
    totalRevenue,
    totalOrders,
    activeProducts,
    totalCustomers,
    salesLast7Days,
    recentTransactions,
    topSellingProducts,
  } = dashboardData;

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue, currency.code)}</div>
            <p className="text-xs text-muted-foreground">Total de ventas facturadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total de pedidos realizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts}</div>
            <p className="text-xs text-muted-foreground">Productos con stock disponible</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Total de clientes registrados</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento de Ventas</CardTitle>
            <CardDescription>Ventas de los últimos 7 días.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesLast7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value, currency.code, 0)}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--primary-light))' }}
                  content={({ active, payload, label }) =>
                    active && payload && payload.length ? (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Fecha
                            </span>
                            <span className="font-bold">{label}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Ingresos
                            </span>
                            <span className="font-bold text-primary">
                              {formatCurrency(payload[0].value as number, currency.code)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Productos Estrella</CardTitle>
            <CardDescription>Los 5 productos más vendidos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Unidades</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellingProducts.map(({ product, quantity, revenue }) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                    </TableCell>
                    <TableCell className="text-center">{quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(revenue, currency.code)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
       <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Transacciones Recientes</CardTitle>
              <CardDescription>
                Últimos pedidos realizados en la tienda.
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
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {order.customer_phone}
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}
                       className={cn(
                        order.status === 'pending-approval' && 'bg-yellow-100 text-yellow-800',
                        order.status === 'pending-payment' && 'bg-amber-100 text-amber-800',
                        order.status === 'paid' && 'bg-green-100 text-green-800',
                       )}
                       >{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), 'd MMM, yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(order.total, currency.code)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
