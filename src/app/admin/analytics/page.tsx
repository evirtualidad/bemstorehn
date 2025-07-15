
'use client';

import {
  DollarSign,
  Users,
  TrendingUp,
  Package,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn, formatCurrency } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { addDays, format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import React from 'react';
import { useCurrencyStore } from '@/hooks/use-currency';
import Image from 'next/image';
import { useCategoriesStore } from '@/hooks/use-categories';
import { type Product } from '@/lib/products';
import { useProductsStore } from '@/hooks/use-products';


const salesOverTimeData = [
  { date: subDays(new Date(), 9).toISOString().split('T')[0], sales: 2500 },
  { date: subDays(new Date(), 8).toISOString().split('T')[0], sales: 3000 },
  { date: subDays(new Date(), 7).toISOString().split('T')[0], sales: 4500 },
  { date: subDays(new Date(), 6).toISOString().split('T')[0], sales: 4000 },
  { date: subDays(new Date(), 5).toISOString().split('T')[0], sales: 5500 },
  { date: subDays(new Date(), 4).toISOString().split('T')[0], sales: 6000 },
  { date: subDays(new Date(), 3).toISOString().split('T')[0], sales: 5000 },
  { date: subDays(new Date(), 2).toISOString().split('T')[0], sales: 7500 },
  { date: subDays(new Date(), 1).toISOString().split('T')[0], sales: 8000 },
  { date: new Date().toISOString().split('T')[0], sales: 7000 },
];

const topProductsData: (Product & { unitsSold: number, revenue: number })[] = [
    {
        id: 'prod_004',
        name: 'Luminous Foundation',
        image: 'https://placehold.co/400x400.png',
        aiHint: 'makeup foundation',
        price: 52.00,
        description: 'A medium-coverage foundation that provides a natural, luminous finish. Available in 20 shades.',
        category: 'Makeup',
        stock: 30,
        unitsSold: 120,
        revenue: 6240
    },
    {
        id: 'prod_001',
        name: 'Glow Serum',
        image: 'https://placehold.co/400x400.png',
        aiHint: 'skincare serum',
        price: 35.00,
        description: 'A vitamin C serum for a radiant and even skin tone. Fights free radicals and boosts collagen production.',
        category: 'Skincare',
        stock: 25,
        unitsSold: 95,
        revenue: 3325
    },
    {
        id: 'prod_008',
        name: 'Waterproof Mascara',
        image: 'https://placehold.co/400x400.png',
        aiHint: 'eye mascara',
        price: 26.00,
        description: 'A clump-free, waterproof mascara that lengthens and defines lashes for a dramatic look.',
        category: 'Makeup',
        stock: 60,
        unitsSold: 150,
        revenue: 3900
    },
    {
        id: 'prod_010',
        name: 'Eyeshadow Palette',
        image: 'https://placehold.co/400x400.png',
        aiHint: 'eyeshadow makeup',
        price: 39.00,
        description: 'A versatile palette of 12 neutral and bold eyeshadows in matte and shimmer finishes.',
        category: 'Makeup',
        stock: 20,
        unitsSold: 80,
        revenue: 3120
    },
    {
        id: 'prod_002',
        name: 'Hydra-Boost Moisturizer',
        image: 'https://placehold.co/400x400.png',
        aiHint: 'face cream',
        price: 38.50,
        description: 'A lightweight, hyaluronic acid-based moisturizer for all-day hydration without a greasy feel.',
        category: 'Skincare',
        stock: 50,
        unitsSold: 70,
        revenue: 2695
    },
].sort((a,b) => b.revenue - a.revenue);


const CustomTooltip = ({ active, payload, label, currencyCode }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Fecha
            </span>
            <span className="font-bold text-muted-foreground">
              {format(new Date(label), 'd MMM, yyyy', { locale: es })}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Ventas
            </span>
            <span className="font-bold text-foreground">
              {formatCurrency(payload[0].value, currencyCode)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default function AnalyticsPage() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const { currency } = useCurrencyStore();
  const { categories } = useCategoriesStore();
  const { products } = useProductsStore();
  
  const salesByCategoryData = categories.map((cat, index) => {
    const productsInCategory = products.filter(p => p.category === cat.name);
    const totalRevenue = productsInCategory.reduce((acc, p) => acc + (p.price * (50-p.stock)), 0);
    return {
      name: cat.label,
      value: Math.floor(totalRevenue), // Mock revenue calculation
      color: `hsl(var(--chart-${index + 1}))`
    }
  }).filter(c => c.value > 0);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 mb-4">
          <h1 className="text-2xl font-bold">Analíticas</h1>
          <div className="ml-auto flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[260px] justify-start text-left font-normal",
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
                    <span>Selecciona una fecha</span>
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
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Valor Promedio de Pedido</CardDescription>
                  <CardTitle className="text-4xl">{formatCurrency(75.50, currency.code)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    +5.2% desde el mes pasado
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Tasa de Conversión</CardDescription>
                  <CardTitle className="text-4xl">3.25%</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    +8.1% desde el mes pasado
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Clientes Nuevos</CardDescription>
                  <CardTitle className="text-4xl">+125</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    +15% este mes
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Clientes Recurrentes</CardDescription>
                  <CardTitle className="text-4xl">62</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    +3% este mes
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="px-7">
                <CardTitle>Rendimiento de Ventas</CardTitle>
                <CardDescription>
                  Análisis de ingresos en el período seleccionado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={salesOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: es })}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis 
                        tickFormatter={(val) => formatCurrency(val, currency.code, 0)}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip currencyCode={currency.code} />} />
                    <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
          </div>
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
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
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
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
                    <Legend />
                    <Tooltip formatter={(value: number) => [formatCurrency(value, currency.code), 'Ventas']} />
                  </PieChart>
                </ResponsiveContainer>
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
                                <p className='text-xs text-muted-foreground'>{product.unitsSold} unidades vendidas</p>
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
      </div>
    </div>
  );
}
