
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOrdersStore, type Order } from '@/hooks/use-orders';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Coins,
  CreditCard,
  DollarSign,
  Landmark,
  Banknote,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns/format';
import { differenceInDays } from 'date-fns/differenceInDays';
import { parseISO } from 'date-fns/parseISO';
import { es } from 'date-fns/locale/es';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { paymentMethodIcons, paymentMethodLabels } from '@/lib/payment-methods.tsx';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useRouter } from 'next/navigation';


function FinancialSummary({ orders, currencyCode }: { orders: any[], currencyCode: string }) {
  const financialOrders = orders.filter(o => o.status !== 'pending-approval' && o.status !== 'cancelled');
  
  const summary = React.useMemo(() => {
    const totalRevenue = financialOrders.reduce((acc, order) => acc + order.total, 0);
    const accountsReceivable = financialOrders
      .filter((o) => o.status === 'pending-payment')
      .reduce((acc, order) => acc + order.balance, 0);
    const paidRevenue = totalRevenue - accountsReceivable;
    
    const revenueByMethod = financialOrders.reduce((acc, order) => {
      // For credit, count payments, for others count total
      if (order.payment_method === 'credito') {
          order.payments.forEach(p => {
              const method = p.method;
               if (!acc[method]) {
                  acc[method] = { name: paymentMethodLabels[method], value: 0 };
              }
              acc[method].value += p.amount;
          });
      } else {
        const method = order.payment_method;
        if (!acc[method]) {
            acc[method] = { name: paymentMethodLabels[method], value: 0 };
        }
        if (order.status === 'paid') {
           acc[method].value += order.total;
        }
      }
      return acc;
    }, {} as Record<string, {name: string, value: number}>);
    
    const salesByMonth = financialOrders.reduce((acc, order) => {
        if (!order.created_at) return acc;
        const month = format(parseISO(order.created_at), 'MMM', { locale: es });
        if(!acc[month]){
            acc[month] = { name: month, Ingresos: 0 };
        }
        acc[month].Ingresos += order.total;
        return acc;
    }, {} as Record<string, { name: string, Ingresos: number}>)

    return {
      totalRevenue,
      accountsReceivable,
      paidRevenue,
      revenueByMethod: Object.values(revenueByMethod),
      salesByMonth: Object.values(salesByMonth),
    };
  }, [financialOrders, currencyCode]);

  const PIE_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
  ];

  return (
    <div className="space-y-8">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales (Facturados)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue, currencyCode)}</div>
            <p className="text-xs text-muted-foreground">
              Total de ventas generadas y facturadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Pagados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.paidRevenue, currencyCode)}</div>
            <p className="text-xs text-muted-foreground">
              Dinero que ya ha ingresado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.accountsReceivable, currencyCode)}</div>
            <p className="text-xs text-muted-foreground">
              Pagos a crédito pendientes
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Mes</CardTitle>
            <CardDescription>Un resumen de las ventas mensuales facturadas.</CardDescription>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.salesByMonth}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value, currencyCode, 0)} />
                <Tooltip formatter={(value: number) => [formatCurrency(value, currencyCode), "Ingresos"]} />
                <Bar dataKey="Ingresos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Método de Pago</CardTitle>
            <CardDescription>Distribución de ingresos por cada forma de pago.</CardDescription>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={300}>
               <PieChart>
                 <Tooltip formatter={(value: number) => formatCurrency(value, currencyCode)} />
                 <Pie
                    data={summary.revenueByMethod}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                 >
                    {summary.revenueByMethod.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                 </Pie>
                 <Legend />
               </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RegisterPaymentDialog({ order, children }: { order: Order, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [amount, setAmount] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
    const [paymentReference, setPaymentReference] = React.useState('');
    const [error, setError] = React.useState('');
    const { addPayment } = useOrdersStore();
    const { toast } = useToast();
    const { currency } = useCurrencyStore();
    
    React.useEffect(() => {
        if (!isOpen) {
            // Reset form on close
            setAmount('');
            setPaymentMethod('efectivo');
            setPaymentReference('');
            setError('');
        }
    }, [isOpen]);

    const handleRegisterPayment = () => {
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            setError('Por favor, ingresa un monto válido.');
            return;
        }
        if (paymentAmount > order.balance) {
            setError('El monto no puede ser mayor que el saldo pendiente.');
            return;
        }
        if ((paymentMethod === 'tarjeta' || paymentMethod === 'transferencia') && !paymentReference) {
            setError('Se requiere un número de referencia para este método de pago.');
            return;
        }
        setError('');
        
        addPayment(order.id, paymentAmount, paymentMethod, paymentReference);

        toast({
            title: '¡Pago Registrado!',
            description: `Se registró un pago de ${formatCurrency(paymentAmount, currency.code)} para el pedido ${order.display_id}.`,
        });
        setIsOpen(false);
    }

    const paymentOptions = [
        { value: 'efectivo', label: 'Efectivo', icon: Banknote },
        { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
        { value: 'transferencia', label: 'Transferencia', icon: Landmark },
    ] as const;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Pago para {order.customer_name}</DialogTitle>
                    <DialogDescription>
                        Pedido: {order.display_id} <br/>
                        Saldo pendiente: <span className='font-bold'>{formatCurrency(order.balance, currency.code)}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto a Pagar</Label>
                        <div className="flex gap-2">
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder='0.00'
                            />
                            <Button variant="secondary" onClick={() => setAmount(order.balance.toString())}>
                                Pagar Total
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Forma de Pago</Label>
                        <div className='grid grid-cols-3 gap-2'>
                           {paymentOptions.map(method => (
                             <Button
                                key={method.value}
                                type="button"
                                variant={paymentMethod === method.value ? 'secondary' : 'outline'}
                                onClick={() => setPaymentMethod(method.value)}
                              >
                                 <method.icon className="mr-2 h-4 w-4"/> {method.label}
                             </Button>
                           ))}
                        </div>
                    </div>
                    
                    {(paymentMethod === 'tarjeta' || paymentMethod === 'transferencia') && (
                        <div className="space-y-2">
                            <Label htmlFor="reference">Número de Referencia</Label>
                            <Input
                                id="reference"
                                value={paymentReference}
                                onChange={(e) => setPaymentReference(e.target.value)}
                                placeholder='Ej: 123456789'
                            />
                        </div>
                    )}
                    
                    {error && <p className="text-sm text-destructive pt-2">{error}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleRegisterPayment}>Registrar Pago</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function AccountsReceivable({ orders, currencyCode }: { orders: any[], currencyCode: string }) {
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const creditOrders = React.useMemo(() => orders.filter(o => o.status === 'pending-payment'), [orders]);


  const getStatus = (dueDate: string) => {
    const days = differenceInDays(new Date(), parseISO(dueDate));
    if (days > 0) return { label: `${days} días vencido`, color: 'text-red-500', icon: <AlertCircle className="h-4 w-4 mr-2" /> };
    if (days >= -7 && days <= 0) return { label: `Vence en ${-days === 0 ? 'hoy' : `${-days} días`}`, color: 'text-amber-500', icon: <Clock className="h-4 w-4 mr-2" /> };
    return { label: 'Pendiente', color: 'text-muted-foreground', icon: <Clock className="h-4 w-4 mr-2" /> };
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuentas por Cobrar</CardTitle>
        <CardDescription>
          Gestiona y da seguimiento a todos los pagos pendientes de ventas a crédito.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isClient ? (
           <div className="h-60">
             <LoadingSpinner />
           </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha de Venta</TableHead>
                <TableHead>Fecha de Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Saldo Pendiente</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditOrders.length > 0 ? creditOrders.map(order => {
                  const status = getStatus(order.payment_due_date!);
                  return (
                      <TableRow key={order.id}>
                          <TableCell>
                              <div className="font-medium">{order.customer_name}</div>
                              <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                          </TableCell>
                          <TableCell>{format(parseISO(order.created_at), 'd MMM, yyyy', { locale: es })}</TableCell>
                          <TableCell>{format(parseISO(order.payment_due_date!), 'd MMM, yyyy', { locale: es })}</TableCell>
                          <TableCell>
                              <div className={cn("flex items-center", status.color)}>
                                  {status.icon}
                                  {status.label}
                              </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(order.balance, currencyCode)}</TableCell>
                          <TableCell className="text-right">
                              <RegisterPaymentDialog order={order}>
                                  <Button variant="outline" size="sm">Registrar Pago</Button>
                              </RegisterPaymentDialog>
                          </TableCell>
                      </TableRow>
                  )
              }) : (
                  <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                          No hay cuentas por cobrar pendientes.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function Transactions({ orders, currencyCode }: { orders: any[], currencyCode: string }) {
    const financialOrders = React.useMemo(() => orders.filter(o => o.status !== 'pending-approval' && o.status !== 'cancelled'), [orders]);


    const statusConfig = {
        'pending-payment': { label: 'Pendiente', color: 'bg-amber-100 text-amber-800' },
        'paid': { label: 'Pagado', color: 'bg-green-100 text-green-800' },
    };

    return (
        <Card>
            <CardHeader className="px-7">
                <CardTitle>Transacciones</CardTitle>
                <CardDescription>Una lista de todos los pedidos facturados en tu tienda.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {financialOrders.map(order => {
                         const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || { label: 'Desconocido', color: 'bg-gray-100 text-gray-800'};
                         return (
                            <TableRow key={order.id}>
                                <TableCell>
                                    <div className="font-medium">{order.customer_name}</div>
                                    <div className="hidden text-sm text-muted-foreground md:inline">
                                        {order.display_id}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {paymentMethodIcons[order.payment_method as keyof typeof paymentMethodIcons]}
                                        {paymentMethodLabels[order.payment_method as keyof typeof paymentMethodLabels]}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={'secondary'} className={statusInfo.color}>
                                        {statusInfo.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>{order.created_at ? format(parseISO(order.created_at), 'd MMM, yyyy') : 'N/A'}</TableCell>
                                <TableCell className="text-right">{formatCurrency(order.total, currencyCode)}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default function FinancePage() {
  const { orders, fetchOrders } = useOrdersStore();
  const { currency } = useCurrencyStore();
  const { role } = useAuthStore();
  const router = useRouter();

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  React.useEffect(() => {
    if (role && role !== 'admin') {
      router.replace('/admin/dashboard-v2');
    }
  }, [role, router]);

  if (role !== 'admin') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full flex-col">
        <Tabs defaultValue="summary">
            <div className='flex justify-between items-center mb-4'>
                <h1 className="text-2xl font-bold">Finanzas</h1>
                <TabsList className="rounded-full">
                    <TabsTrigger value="summary">Resumen</TabsTrigger>
                    <TabsTrigger value="accounts-receivable">Cuentas por Cobrar</TabsTrigger>
                    <TabsTrigger value="transactions">Transacciones</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="summary">
                <FinancialSummary orders={orders} currencyCode={currency.code} />
            </TabsContent>
            <TabsContent value="accounts-receivable">
                <AccountsReceivable orders={orders} currencyCode={currency.code} />
            </TabsContent>
                <TabsContent value="transactions">
                <Transactions orders={orders} currencyCode={currency.code} />
                </TabsContent>
        </Tabs>
    </div>
  );
}
