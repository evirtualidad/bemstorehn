
'use client';

import * as React from 'react';
import {
  DollarSign,
  Users,
  CreditCard,
  Archive,
  Calendar as CalendarIcon,
} from 'lucide-react';
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { useOrdersStore } from '@/hooks/use-orders';
import { useProductsStore } from '@/hooks/use-products';
import { useCustomersStore } from '@/hooks/use-customers';
import { useCategoriesStore } from '@/hooks/use-categories';
import { formatCurrency, cn } from '@/lib/utils';
import { useCurrencyStore } from '@/hooks/use-currency';
import { format, subDays, startOfDay, endOfDay, parseISO, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const statusLabels: { [key: string]: string } = {
  'paid': 'Pagado',
  'pending-payment': 'Pendiente de Pago',
  'pending-approval': 'Pendiente Aprobación',
  'cancelled': 'Cancelado',
};

export default function Dashboard() {
  const { orders } = useOrdersStore();
  const { products } = useProductsStore();
  const { customers } = useCustomersStore();
  const { categories } = useCategoriesStore();
  const { currency } = useCurrencyStore();
  const [isClient, setIsClient] = React.useState(false);
  
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const dashboardData = React.useMemo(() => {
    const { from, to } = date || {};
    const startDate = from ? startOfDay(from) : new Date(0);
    const endDate = to ? endOfDay(to) : new Date();

    const filteredOrders = orders.filter(o => {
        const orderDate = parseISO(o.created_at);
        return o.status !== 'cancelled' && o.status !== 'pending-approval' && isAfter(orderDate, startDate) && isBefore(orderDate, endDate);
    });

    const totalRevenue = filteredOrders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = filteredOrders.length;
    
    const activeProducts = products.filter((p) => p.stock > 0).length;
    const totalCustomers = customers.length; 

    // --- Chart Data Calculations ---

    // Sales by Channel
    const salesByChannel = filteredOrders.reduce((acc, order) => {
        const channel = order.source === 'pos' ? 'POS' : 'Tienda Online';
        if (!acc[channel]) {
            acc[channel] = 0;
        }
        acc[channel] += order.total;
        return acc;
    }, {} as Record<string, number>);

    const salesByChannelData = Object.entries(salesByChannel).map(([name, value]) => ({ name, value }));

    // Sales by Category
    const salesByCategory = filteredOrders.reduce((acc, order) => {
        order.items.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                const category = categories.find(c => c.name === product.category)?.label || 'Sin Categoría';
                 if (!acc[category]) {
                    acc[category] = 0;
                }
                acc[category] += item.price * item.quantity;
            }
        });
        return acc;
    }, {} as Record<string, number>);
    
    const salesByCategoryData = Object.entries(salesByCategory).map(([name, value]) => ({ name, value }));

    // Sales last 30 days (Bar Chart) - This logic remains for the 30-day overview chart regardless of filter
    const salesLast30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), i);
        return {
            date: format(date, 'MMM d', { locale: es }),
            total: 0,
        };
    }).reverse();

    orders.filter(o => o.status !== 'cancelled' && o.status !== 'pending-approval').forEach(order => {
        const orderDate = parseISO(order.created_at);
        const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));
        if (orderDate >= thirtyDaysAgo) {
            const dateStr = format(orderDate, 'MMM d', { locale: es });
            const dayData = salesLast30Days.find(d => d.date === dateStr);
            if (dayData) {
                dayData.total += order.total;
            }
        }
    });


    // Top Selling Products
    const productSales = new Map<string, { product: any; quantity: number; revenue: number }>();
    filteredOrders.forEach(order => {
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
      salesLast30Days,
      recentTransactions: filteredOrders.slice(0, 5),
      topSellingProducts,
      salesByChannelData,
      salesByCategoryData,
    };
  }, [orders, products, customers, categories, date]);
  
  if (!isClient) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }


  const {
    totalRevenue,
    totalOrders,
    activeProducts,
    totalCustomers,
    salesLast30Days,
    recentTransactions,
    topSellingProducts,
    salesByChannelData,
    salesByCategoryData,
  } = dashboardData;

  const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
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
        );
      }
      return null;
  };
  
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-bold text-primary">{`${data.name}: ${formatCurrency(data.value, currency.code)}`}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <main className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                        {format(date.to, "LLL dd, y", { locale: es })}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y", { locale: es })
                    )
                  ) : (
                    <span>Selecciona un rango</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
        </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue, currency.code)}</div>
            <p className="text-xs text-muted-foreground">Ingresos en el período seleccionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Pedidos en el período seleccionado</p>
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
            <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Total de clientes registrados</p>
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <CardTitle>Rendimiento de Ventas (Últimos 30 días)</CardTitle>
            <CardDescription>Esta gráfica siempre muestra los últimos 30 días, independientemente del filtro.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={salesLast30Days}>
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
                  content={<CustomTooltip />}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Ventas por Canal</CardTitle>
                <CardDescription>Distribución de ventas por canal en el período seleccionado.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                {salesByChannelData.length > 0 ? (
                    <PieChart>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Pie
                            data={salesByChannelData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {salesByChannelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Legend />
                    </PieChart>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">Sin datos para este período.</div>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Ventas por Categoría</CardTitle>
                <CardDescription>Distribución de ventas por categoría en el período seleccionado.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={300}>
                    {salesByCategoryData.length > 0 ? (
                        <PieChart>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Pie
                                data={salesByCategoryData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {salesByCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">Sin datos para este período.</div>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Productos Estrella</CardTitle>
            <CardDescription>Los 5 productos más vendidos en el período seleccionado.</CardDescription>
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
                {topSellingProducts.length > 0 ? topSellingProducts.map(({ product, quantity, revenue }) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                    </TableCell>
                    <TableCell className="text-center">{quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(revenue, currency.code)}
                    </TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            No hay datos de ventas en este período.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>
              Últimos pedidos realizados en el período seleccionado.
            </CardDescription>
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
                {recentTransactions.length > 0 ? recentTransactions.map((order) => (
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
                        order.status === 'pending-payment' && 'bg-amber-100 text-amber-800',
                        order.status === 'paid' && 'bg-green-100 text-green-800',
                       )}
                       >{statusLabels[order.status] || order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), 'd MMM, yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(order.total, currency.code)}</TableCell>
                  </TableRow>
                )) : (
                     <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            No hay transacciones en este período.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
       </div>
    </main>
  );
}
