
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns/format';
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { DateRange } from 'react-day-picker';

import {
  Banknote,
  CalendarIcon,
  Check,
  CreditCard,
  Landmark,
  MoreHorizontal,
  Coins,
  XCircle,
  Package,
  Store,
  Truck,
  ListFilter,
  X
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useCurrencyStore } from '@/hooks/use-currency';
import { useOrdersStore, type Order } from '@/hooks/use-orders';
import { useProductsStore } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

const paymentMethods = [
    { value: 'efectivo', label: 'Efectivo', icon: Banknote },
    { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
    { value: 'transferencia', label: 'Transferencia', icon: Landmark },
    { value: 'credito', label: 'Crédito', icon: Coins },
] as const;

const paymentMethodIcons = {
  efectivo: <Banknote className="h-4 w-4 text-muted-foreground" />,
  tarjeta: <CreditCard className="h-4 w-4 text-muted-foreground" />,
  transferencia: <Landmark className="h-4 w-4 text-muted-foreground" />,
  credito: <Coins className="h-4 w-4 text-muted-foreground" />,
};

const paymentMethodLabels = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  credito: 'Crédito',
};

const orderApprovalFormSchema = z
  .object({
    paymentMethod: z.enum(['efectivo', 'tarjeta', 'transferencia', 'credito']),
    paymentDueDate: z.date().optional(),
    paymentReference: z.string().optional(),
  })
  .refine(data => data.paymentMethod !== 'credito' || !!data.paymentDueDate, {
    message: 'La fecha de pago es obligatoria para pagos a crédito.',
    path: ['paymentDueDate'],
  });


const statusConfig = {
    'pending-approval': { label: 'Pendiente Aprobación', color: 'bg-yellow-100 text-yellow-800' },
    'pending-payment': { label: 'Pendiente Pago', color: 'bg-amber-100 text-amber-800' },
    'paid': { label: 'Pagado', color: 'bg-green-100 text-green-800' },
    'cancelled': { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

function OrderDetailsDialog({ order, isOpen, onOpenChange }: { order: Order | null; isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const { currency } = useCurrencyStore();
    const { taxRate } = useSettingsStore();
    
    if (!order) return null;

    const subtotal = order.total / (1 + taxRate);
    const tax = order.total - subtotal;
    
    const deliveryMethodIcon = order.deliveryMethod === 'pickup' ? <Store className="mr-2 h-4 w-4"/> : <Truck className="mr-2 h-4 w-4"/>;
    const deliveryMethodLabel = order.deliveryMethod === 'pickup' ? 'Recoger en Tienda' : 'Envío a Domicilio';
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Detalles del Pedido: {order.id}</DialogTitle>
                    <DialogDescription>
                        {format(parseISO(order.date), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] -mx-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-4">
                    <div>
                        <h3 className='font-semibold mb-2'>Cliente</h3>
                        <p>{order.customer.name}</p>
                        <p className='text-sm text-muted-foreground'>{order.customer.phone}</p>
                    </div>
                    
                    {order.deliveryMethod === 'delivery' && order.customer.address && (
                        <div>
                            <h3 className='font-semibold mb-2'>Dirección de Envío</h3>
                            <p>{order.customer.address.exactAddress}, {order.customer.address.colony}</p>
                            <p className='text-sm text-muted-foreground'>{order.customer.address.municipality}, {order.customer.address.department}</p>
                        </div>
                    )}
                    
                    <div>
                        <h3 className='font-semibold mb-2'>Método de Entrega</h3>
                        <div className="flex items-center">
                            {deliveryMethodIcon}
                            <span>{deliveryMethodLabel}</span>
                        </div>
                    </div>
                    <div>
                        <h3 className='font-semibold mb-2'>Método de Pago</h3>
                        <div className="flex items-center">
                            {paymentMethodIcons[order.paymentMethod]}
                            <span>{paymentMethodLabels[order.paymentMethod]}</span>
                        </div>
                    </div>
                 </div>

                <Separator className="my-2" />
                
                <div className="px-6">
                    <h3 className='font-semibold mb-4'>Artículos</h3>
                    <div className="space-y-4">
                        {order.items.map(item => (
                            <div key={item.id} className="flex items-center gap-4">
                                <Image src={item.image} alt={item.name} width={56} height={56} className="rounded-md aspect-square object-cover" />
                                <div className="flex-1">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {item.quantity} x {formatCurrency(item.price, currency.code)}
                                    </p>
                                </div>
                                <p className="font-semibold">{formatCurrency(item.price * item.quantity, currency.code)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 px-6">
                     <div className="flex justify-between text-sm">
                        <p className="text-muted-foreground">Subtotal</p>
                        <p>{formatCurrency(subtotal, currency.code)}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                        <p className="text-muted-foreground">ISV ({taxRate * 100}%)</p>
                        <p>{formatCurrency(tax, currency.code)}</p>
                    </div>
                    {order.shippingCost && order.shippingCost > 0 && (
                        <div className="flex justify-between text-sm">
                            <p className="text-muted-foreground">Envío</p>
                            <p>{formatCurrency(order.shippingCost, currency.code)}</p>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                        <p>Total</p>
                        <p>{formatCurrency(order.total, currency.code)}</p>
                    </div>
                </div>

                </ScrollArea>
                <DialogFooter className='px-6 pt-4'>
                    <DialogClose asChild>
                        <Button variant="outline">Cerrar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ApproveOrderDialog({ order, children }: { order: Order; children: React.ReactNode }) {
    const { approveOrder } = useOrdersStore();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = React.useState(false);

    const form = useForm<z.infer<typeof orderApprovalFormSchema>>({
        resolver: zodResolver(orderApprovalFormSchema),
        defaultValues: {
            paymentMethod: order.paymentMethod || 'tarjeta',
            paymentReference: order.paymentReference || '',
        },
    });

    async function onSubmit(values: z.infer<typeof orderApprovalFormSchema>) {
        approveOrder({
            orderId: order.id,
            paymentMethod: values.paymentMethod,
            paymentDueDate: values.paymentDueDate,
            paymentReference: values.paymentReference,
        });
        toast({ title: '¡Pedido Aprobado!', description: `El pedido ${order.id} ha sido facturado.` });
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Aprobar y Facturar Pedido {order.id}</DialogTitle>
                    <DialogDescription>Selecciona el método de pago para finalizar la transacción.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form id="approve-order-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Forma de Pago</FormLabel>
                                    <div className='grid grid-cols-2 gap-2'>
                                        {paymentMethods.map(method => (
                                            <Button
                                                key={method.value}
                                                type="button"
                                                variant={field.value === method.value ? 'secondary' : 'outline'}
                                                className="h-12"
                                                onClick={() => field.onChange(method.value)}
                                            >
                                                <method.icon className="mr-2 h-4 w-4" /> {method.label}
                                            </Button>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         {form.watch('paymentMethod') === 'credito' && (
                            <FormField
                                control={form.control}
                                name="paymentDueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha Límite de Pago</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={'outline'}
                                                        className={cn(!field.value && 'text-muted-foreground')}
                                                    >
                                                        {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Selecciona fecha</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    locale={es}
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date < new Date() }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </form>
                </Form>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" form="approve-order-form">
                        Aprobar Pedido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RejectOrderDialog({ order, children }: { order: Order; children: React.ReactNode }) {
    const { cancelOrder } = useOrdersStore();
    const { increaseStock } = useProductsStore();
    const { toast } = useToast();

    const handleReject = () => {
        cancelOrder(order.id);
        order.items.forEach(item => {
            increaseStock(item.id, item.quantity);
        });
        toast({
            title: 'Pedido Rechazado',
            description: `El pedido ${order.id} ha sido cancelado y el stock ha sido devuelto.`,
            variant: 'destructive',
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres rechazar este pedido?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción es irreversible. El pedido <span className='font-bold'>{order.id}</span> será cancelado y el stock de los productos será devuelto al inventario.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>No, mantener pedido</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReject} className={cn(buttonVariants({ variant: "destructive" }))}>
                        Sí, rechazar pedido
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function CancelOrderDialog({ order, onCancel }: { order: Order; onCancel: () => void }) {
    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de que quieres cancelar este pedido?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción es irreversible. El pedido <span className='font-bold'>{order.id}</span> será cancelado. Si el pedido no estaba cancelado previamente, el stock de los productos será devuelto al inventario.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>No, mantener pedido</AlertDialogCancel>
                <AlertDialogAction onClick={onCancel} className={cn(buttonVariants({ variant: "destructive" }))}>
                    Sí, cancelar pedido
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}


export default function OrdersPage() {
  const { orders, cancelOrder } = useOrdersStore();
  const { increaseStock } = useProductsStore();
  const { currency } = useCurrencyStore();
  const { toast } = useToast();
  
  const [orderToCancel, setOrderToCancel] = React.useState<Order | null>(null);
  const [detailsOrder, setDetailsOrder] = React.useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  // Filter states
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [channelFilter, setChannelFilter] = React.useState<string[]>([]);

  const sortedOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredOrders = React.useMemo(() => {
    return sortedOrders.filter(order => {
      // Date filter
      if (dateRange?.from && dateRange?.to) {
        const orderDate = parseISO(order.date);
        if (!isWithinInterval(orderDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) })) {
          return false;
        }
      }
      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(order.status)) {
        return false;
      }
      // Channel filter
      if (channelFilter.length > 0 && !channelFilter.includes(order.source)) {
        return false;
      }
      return true;
    });
  }, [sortedOrders, dateRange, statusFilter, channelFilter]);

  const handleStatusFilterChange = (status: string, checked: boolean) => {
    setStatusFilter(prev => 
      checked ? [...prev, status] : prev.filter(s => s !== status)
    );
  };
  
  const handleChannelFilterChange = (channel: string, checked: boolean) => {
    setChannelFilter(prev => 
      checked ? [...prev, channel] : prev.filter(c => c !== channel)
    );
  };
  
  const clearFilters = () => {
    setDateRange(undefined);
    setStatusFilter([]);
    setChannelFilter([]);
  };

  const handleConfirmCancel = () => {
    if (!orderToCancel) return;

    if (orderToCancel.status !== 'cancelled') {
        orderToCancel.items.forEach(item => {
            increaseStock(item.id, item.quantity);
        });
    }
    
    cancelOrder(orderToCancel.id);

    toast({
        title: 'Pedido Cancelado',
        description: `El pedido ${orderToCancel.id} ha sido cancelado y el stock ha sido devuelto.`,
        variant: 'destructive',
    });
    setOrderToCancel(null);
  };
  
  const handleViewDetails = (order: Order) => {
    setDetailsOrder(order);
    setIsDetailsOpen(true);
  };

  const isFiltered = dateRange || statusFilter.length > 0 || channelFilter.length > 0;

  return (
    <main className="grid flex-1 items-start gap-4">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Pedidos</h1>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Historial de Pedidos</CardTitle>
                <CardDescription>
                  Una lista de todos los pedidos realizados en tu tienda.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 gap-1">
                            <ListFilter className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Filtrar
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.entries(statusConfig).map(([key, config]) => (
                            <DropdownMenuCheckboxItem
                                key={key}
                                checked={statusFilter.includes(key)}
                                onCheckedChange={(checked) => handleStatusFilterChange(key, checked)}
                            >
                                {config.label}
                            </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Filtrar por Canal</DropdownMenuLabel>
                         <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={channelFilter.includes('pos')}
                            onCheckedChange={(checked) => handleChannelFilterChange('pos', checked)}
                        >
                            POS
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={channelFilter.includes('online-store')}
                            onCheckedChange={(checked) => handleChannelFilterChange('online-store', checked)}
                        >
                            Tienda Online
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {isFiltered && (
                    <Button variant="ghost" onClick={clearFilters}>
                        <X className="mr-2 h-4 w-4" />
                        Limpiar
                    </Button>
                )}
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || { label: 'Desconocido', color: 'bg-gray-100 text-gray-800'};
                return (
                    <TableRow key={order.id}>
                    <TableCell>
                        <div className="font-medium text-primary hover:underline cursor-pointer" onClick={() => handleViewDetails(order)}>{order.id}</div>
                         {order.paymentMethod === 'transferencia' && order.paymentReference && (
                           <p className="text-xs text-muted-foreground">Ref: {order.paymentReference}</p>
                         )}
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{order.customer.name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer.phone}</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline">{order.source === 'pos' ? 'POS' : 'Tienda Online'}</Badge>
                    </TableCell>
                    <TableCell>{format(parseISO(order.date), 'd MMM, yyyy')}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            {paymentMethodIcons[order.paymentMethod as keyof typeof paymentMethodIcons]}
                            {paymentMethodLabels[order.paymentMethod as keyof typeof paymentMethodLabels]}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={'secondary'} className={statusInfo.color}>
                            {statusInfo.label}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(order.total, currency.code)}</TableCell>
                    <TableCell className="text-center">
                         {order.status === 'pending-approval' ? (
                            <div className="flex items-center justify-center gap-2">
                                <ApproveOrderDialog order={order}>
                                    <Button size="sm" variant="outline">
                                        <Check className='mr-2 h-4 w-4' />
                                        Aprobar
                                    </Button>
                                </ApproveOrderDialog>
                                <RejectOrderDialog order={order}>
                                     <Button size="sm" variant="destructive">
                                        <XCircle className='mr-2 h-4 w-4' />
                                        Rechazar
                                    </Button>
                                </RejectOrderDialog>
                            </div>
                        ) : (
                            <AlertDialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button
                                        aria-haspopup="true"
                                        size="icon"
                                        variant="ghost"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Alternar menú</span>
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <DropdownMenuItem onSelect={() => handleViewDetails(order)}>Ver Detalles</DropdownMenuItem>
                                        {order.status !== 'cancelled' && (
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOrderToCancel(order); }}>
                                                    Cancelar Pedido
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                {orderToCancel && orderToCancel.id === order.id && (
                                     <CancelOrderDialog order={orderToCancel} onCancel={handleConfirmCancel} />
                                )}
                             </AlertDialog>
                        )}
                    </TableCell>
                    </TableRow>
                )
              }) : (
                <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                        No se encontraron pedidos con los filtros aplicados.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Mostrando <strong>{filteredOrders.length}</strong> de <strong>{orders.length}</strong> pedidos.
            </div>
        </CardFooter>
      </Card>
      
      <OrderDetailsDialog order={detailsOrder} isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
    </main>
  );
}
