
'use client';

import {
  ArrowUpRight,
  DollarSign,
  Users,
  Package,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import React from 'react';
import { useProductsStore } from '@/hooks/use-products';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useOrdersStore } from '@/hooks/use-orders';
import { useCustomersStore } from '@/hooks/use-customers';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { parseISO } from 'date-fns/parseISO';
import { useCategoriesStore } from '@/hooks/use-categories';
import Image from 'next/image';
import { type Product } from '@/lib/products';

export default function DashboardV2() {
  const { products, isHydrated: productsHydrated } = useProductsStore();
  const { orders, isHydrated: ordersHydrated } = useOrdersStore();
  const { customers, isHydrated: customersHydrated } = useCustomersStore();
  const { categories, getCategoryByName } = useCategoriesStore();
  const { currency } = useCurrencyStore();

  const isHydrated = productsHydrated && ordersHydrated && customersHydrated;

  const {
    totalRevenue,
    totalOrders,
    activeProducts,
    salesData,
    recentTransactions,
    salesByCategoryData,
    topProductsData
  } = React.useMemo(() => {
    if (!isHydrated) return { totalRevenue: 0, totalOrders: 0, activeProducts: 0, salesData: [], recentTransactions: [], salesByCategoryData: [], topProductsData: [] };

    const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'pending-approval');
    const totalRevenue = nonCancelledOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrdersValue = nonCancelledOrders.length;
    const activeProductsValue = products.filter(p => p.stock > 0).length;

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
    
    const recentTransactions = [...nonCancelledOrders]
      .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .slice(0, 5);

    const salesByCategoryMap = nonCancelledOrders.flatMap(o => o.items).reduce((acc, item) => {
      const product = products.find(p => p.id === item.id);
      if (product) { // Ensure product exists before processing
        const category = product.category;
        const value = item.price * item.quantity;
        acc[category] = (acc[category] || 0) + value;
      }
      return acc;
    }, {} as Record<string, number>);

    const salesByCategoryData = Object.entries(salesByCategoryMap).map(([categoryName, totalValue], index) => {
      const categoryLabel = getCategoryByName(categoryName)?.label || categoryName;
      return {
        name: categoryLabel,
        value: Math.floor(totalValue),
        color: `hsl(var(--chart-${index + 1}))`
      }
    }).filter(c => c.value > 0);


    const productSales = nonCancelledOrders.flatMap(o => o.items).reduce((acc, item) => {
        const productInfo = products.find(p => p.id === item.id);
        if (!productInfo) return acc; // Gracefully skip if product not found

        if (!acc[item.id]) {
            acc[item.id] = { ...productInfo, unitsSold: 0, revenue: 0 };
        }
        acc[item.id].unitsSold += item.quantity;
        acc[item.id].revenue += item.price * item.quantity;
        return acc;
    }, {} as Record<string, Product & { unitsSold: number, revenue: number }>);

    const topProductsData = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return { totalRevenue, totalOrders: totalOrdersValue, activeProducts: activeProductsValue, salesData, recentTransactions, salesByCategoryData, topProductsData };
  }, [isHydrated, orders, products, getCategoryByName]);
  
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
                <CardTitle>Ventas por Categoría</CardTitle>
                <CardDescription>
                    Distribución de ingresos por categoría de producto.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesByCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        if (percent === 0) return null;
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
                      {salesByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend iconSize={10} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value, currency.code), 'Ventas']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
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
                    Canal
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
        <Card>
              <CardHeader className="px-7">
                <CardTitle>Productos Estrella</CardTitle>
                <CardDescription>
                  Tus productos más vendidos por ingresos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProductsData.slice(0,5).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="rounded-md object-cover aspect-square"
                            />
                            <div>
                                <p className="font-medium leading-tight">{product.name}</p>
                                <p className='text-xs text-muted-foreground'>{product.unitsSold} unidades</p>
                            </div>
                           </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(product.revenue, currency.code)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
        </Card>
      </div>
    </main>
  );
}

    