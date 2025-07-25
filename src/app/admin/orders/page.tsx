
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
  CalendarIcon,
  Check,
  MoreHorizontal,
  XCircle,
  Package,
  Store,
  Truck,
  ListFilter,
  X,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
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
  DialogTrigger,
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
import { useOrdersStore } from '@/hooks/use-orders';
import type { Order } from '@/lib/types';
import { useProductsStore } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { paymentMethods, paymentMethodIcons, paymentMethodLabels } from '@/lib/payment-methods.tsx';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const ITEMS_PER_PAGE = 30;

const deliveryMethodLabels = {
  pickup: 'Recoger en Tienda',
  delivery: 'Envío a Domicilio',
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
  }).refine(data => {
    if (data.paymentMethod === 'tarjeta' || data.paymentMethod === 'transferencia') {
        return !!data.paymentReference && data.paymentReference.length > 3;
    }
    return true;
  }, {
    message: 'La referencia es obligatoria para este método de pago.',
    path: ['paymentReference'],
  });


const statusConfig = {
    'pending-approval': { label: 'Pendiente Aprobación', color: 'bg-yellow-100 text-yellow-800' },
    'pending-payment': { label: 'Pendiente Pago', color: 'bg-amber-100 text-amber-800' },
    'paid': { label: 'Pagado', color: 'bg-green-100 text-green-800' },
    'cancelled': { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

function OrderDetailsDialog({ order, isOpen, onOpenChange }: { order: Order | null; isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const { currency } = useCurrencyStore();
    const { settings } = useSettingsStore();
    
    if (!order || !settings) return null;

    const taxRate = settings.tax_rate;
    const subtotal = order.total / (1 + taxRate);
    const tax = order.total - subtotal;
    
    const deliveryMethodIcon = order.delivery_method === 'pickup' ? <Store className="mr-2 h-4 w-4"/> : <Truck className="mr-2 h-4 w-4"/>;
    const deliveryMethodLabel = order.delivery_method === 'pickup' ? 'Recoger en Tienda' : 'Envío a Domicilio';
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Detalles del Pedido: {order.display_id}</DialogTitle>
                    <DialogDescription>
                        {order.created_at ? format(parseISO(order.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es }) : 'Fecha no disponible'}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] -mx-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-4">
                    <div>
                        <h3 className='font-semibold mb-2'>Cliente</h3>
                        <p>{order.customer_name}</p>
                        <p className='text-sm text-muted-foreground'>{order.customer_phone}</p>
                    </div>
                    
                    {order.delivery_method === 'delivery' && order.customer_address && (
                        <div>
                            <h3 className='font-semibold mb-2'>Dirección de Envío</h3>
                            <p>{order.customer_address.exactAddress}, {order.customer_address.colony}</p>
                            <p className='text-sm text-muted-foreground'>{order.customer_address.municipality}, {order.customer_address.department}</p>
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
                            {paymentMethodIcons[order.payment_method]}
                            <span>{paymentMethodLabels[order.payment_method]}</span>
                        </div>
                    </div>
                 </div>

                <Separator className="my-2" />
                
                <div className="px-6">
                    <h3 className='font-semibold mb-4'>Artículos</h3>
                    <div className="space-y-4">
                        {order.items.map(item => (
                            <div key={item.id} className="flex items-center gap-4">
                                <Image src={item.image} alt={item.name} width={56} height={56} className="rounded-lg aspect-square object-cover" />
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
                    {order.shipping_cost && order.shipping_cost > 0 && (
                        <div className="flex justify-between text-sm">
                            <p className="text-muted-foreground">Envío</p>
                            <p>{formatCurrency(order.shipping_cost, currency.code)}</p>
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
    const { getProductById } = useProductsStore();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = React.useState(false);
    const [today, setToday] = React.useState<Date | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            setToday(new Date());
        }
    }, [isOpen]);

    const form = useForm<z.infer<typeof orderApprovalFormSchema>>({
        resolver: zodResolver(orderApprovalFormSchema),
        defaultValues: {
            paymentMethod: order.payment_method || 'tarjeta',
            paymentReference: '',
        },
    });

    async function onSubmit(values: z.infer<typeof orderApprovalFormSchema>) {
        // --- Stock Validation ---
        for (const item of order.items) {
            const product = getProductById(item.id);
            if (!product || product.stock < item.quantity) {
                toast({
                    title: '¡Stock Insuficiente!',
                    description: `No hay suficiente stock para "${item.name}". Stock disponible: ${product?.stock || 0}, Pedido: ${item.quantity}.`,
                    variant: 'destructive',
                });
                return; // Stop the process
            }
        }

        await approveOrder({
            orderId: order.id,
            paymentMethod: values.paymentMethod,
            paymentDueDate: values.paymentDueDate,
            paymentReference: values.paymentReference,
        });

        toast({ title: '¡Pedido Aprobado!', description: `El pedido ${order.display_id} ha sido facturado.` });
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Aprobar y Facturar Pedido {order.display_id}</DialogTitle>
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
                                                className="h-12 rounded-lg"
                                                onClick={() => field.onChange(method.value)}
                                            >
                                                <method.icon /> {method.label}
                                            </Button>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {(form.watch('paymentMethod') === 'tarjeta' || form.watch('paymentMethod') === 'transferencia') && (
                            <FormField
                                control={form.control}
                                name="paymentReference"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Referencia</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: 123456789" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
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
                                                        className={cn("rounded-lg", !field.value && "text-muted-foreground")}
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
                                                    disabled={(date) => {
                                                        if (!today) return true;
                                                        return date < today;
                                                    }}
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
    const { toast } = useToast();

    const handleReject = async () => {
        await cancelOrder(order.id);
        toast({
            title: 'Pedido Rechazado',
            description: `El pedido ${order.display_id} ha sido cancelado. El stock NO ha sido devuelto.`,
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
                        Esta acción es irreversible. El pedido <span className='font-bold'>{order.display_id}</span> será marcado como cancelado. El stock de los productos no se verá afectado.
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

function CancelOrderDialog({ order, children }: { order: Order; children: React.ReactNode }) {
    const { cancelOrder } = useOrdersStore();

    const handleCancel = async () => {
        await cancelOrder(order.id);
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres cancelar este pedido?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción es irreversible. El pedido <span className='font-bold'>{order.display_id}</span> será cancelado. Si el pedido ya había sido facturado, el stock de los productos será devuelto al inventario.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>No, mantener pedido</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} className={cn(buttonVariants({ variant: "destructive" }))}>
                        Sí, cancelar pedido
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


export default function OrdersPage() {
  const { orders, isLoading } = useOrdersStore();
  const { currency } = useCurrencyStore();
  
  const [detailsOrder, setDetailsOrder] = React.useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  // Filter and pagination states
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [channelFilter, setChannelFilter] = React.useState<string[]>([]);
  const [paymentMethodFilter, setPaymentMethodFilter] = React.useState<string[]>([]);
  const [deliveryMethodFilter, setDeliveryMethodFilter] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);

  const sortedOrders = [...orders].sort((a, b) => {
    if (!a.created_at || !b.created_at) return 0;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filteredOrders = React.useMemo(() => {
    return sortedOrders.filter(order => {
      // Date filter
      if (dateRange?.from && dateRange?.to) {
        if (!order.created_at) return false;
        const orderDate = parseISO(order.created_at);
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
       // Payment Method filter
      if (paymentMethodFilter.length > 0 && !paymentMethodFilter.includes(order.payment_method)) {
        return false;
      }
       // Delivery Method filter
      if (deliveryMethodFilter.length > 0 && !deliveryMethodFilter.includes(order.delivery_method || '')) {
        return false;
      }
      return true;
    });
  }, [sortedOrders, dateRange, statusFilter, channelFilter, paymentMethodFilter, deliveryMethodFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, statusFilter, channelFilter, paymentMethodFilter, deliveryMethodFilter]);

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string, checked: boolean) => {
    setter(prev => 
      checked ? [...prev, value] : prev.filter(v => v !== value)
    );
  };
  
  const clearFilters = () => {
    setDateRange(undefined);
    setStatusFilter([]);
    setChannelFilter([]);
    setPaymentMethodFilter([]);
    setDeliveryMethodFilter([]);
  };

  const handleViewDetails = (order: Order) => {
    setDetailsOrder(order);
    setIsDetailsOpen(true);
  };

  const isFiltered = dateRange || statusFilter.length > 0 || channelFilter.length > 0 || paymentMethodFilter.length > 0 || deliveryMethodFilter.length > 0;

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full">
            <LoadingSpinner />
        </div>
    );
  }

  return (
    <div className="grid flex-1 items-start gap-4">
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
              <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full sm:w-auto justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y", { locale: es })} - {format(dateRange.to, "LLL dd, y", { locale: es })}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y", { locale: es })
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
                        <Button variant="outline" size="sm" className="h-10 gap-1 w-full sm:w-auto">
                            <ListFilter className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Filtros
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
                                onCheckedChange={(checked) => handleFilterChange(setStatusFilter)(key, checked as boolean)}
                            >
                                {config.label}
                            </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Filtrar por Canal</DropdownMenuLabel>
                         <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={channelFilter.includes('pos')}
                            onCheckedChange={(checked) => handleFilterChange(setChannelFilter)('pos', checked as boolean)}
                        >
                            POS
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={channelFilter.includes('online-store')}
                            onCheckedChange={(checked) => handleFilterChange(setChannelFilter)('online-store', checked as boolean)}
                        >
                            Tienda Online
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Método de Pago</DropdownMenuLabel>
                         <DropdownMenuSeparator />
                        {Object.entries(paymentMethodLabels).map(([key, label]) => (
                          <DropdownMenuCheckboxItem
                              key={key}
                              checked={paymentMethodFilter.includes(key)}
                              onCheckedChange={(checked) => handleFilterChange(setPaymentMethodFilter)(key, checked as boolean)}
                          >
                              {label}
                          </DropdownMenuCheckboxItem>
                        ))}
                         <DropdownMenuSeparator />
                        <DropdownMenuLabel>Tipo de Pedido</DropdownMenuLabel>
                         <DropdownMenuSeparator />
                        {Object.entries(deliveryMethodLabels).map(([key, label]) => (
                          <DropdownMenuCheckboxItem
                              key={key}
                              checked={deliveryMethodFilter.includes(key)}
                              onCheckedChange={(checked) => handleFilterChange(setDeliveryMethodFilter)(key, checked as boolean)}
                          >
                              {label}
                          </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {isFiltered && (
                    <Button variant="ghost" onClick={clearFilters} className="h-10 w-full sm:w-auto">
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
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length > 0 ? paginatedOrders.map((order) => {
                const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || { label: 'Desconocido', color: 'bg-gray-100 text-gray-800'};
                return (
                    <TableRow key={order.id}>
                    <TableCell>
                        <div className="font-medium text-primary hover:underline cursor-pointer" onClick={() => handleViewDetails(order)}>{order.display_id}</div>
                         {order.payment_reference && (
                           <p className="text-xs text-muted-foreground truncate" title={order.payment_reference}>Ref: {order.payment_reference}</p>
                         )}
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline">{order.source === 'pos' ? 'POS' : 'Tienda Online'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.delivery_method === 'pickup' ? <Store className="h-4 w-4 text-muted-foreground" /> : <Truck className="h-4 w-4 text-muted-foreground" />}
                        <span className="hidden sm:inline">{deliveryMethodLabels[order.delivery_method || 'pickup']}</span>
                      </div>
                    </TableCell>
                    <TableCell>{order.created_at ? format(parseISO(order.created_at), 'd MMM, yyyy') : 'N/A'}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            {paymentMethodIcons[order.payment_method as keyof typeof paymentMethodIcons]}
                            <span className="hidden sm:inline">{paymentMethodLabels[order.payment_method as keyof typeof paymentMethodLabels]}</span>
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
                                        <CancelOrderDialog order={order}>
                                            <div className={cn(
                                                "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                                "text-destructive focus:bg-destructive/10 focus:text-destructive"
                                            )}>
                                                Cancelar Pedido
                                            </div>
                                        </CancelOrderDialog>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </TableCell>
                    </TableRow>
                )
              }) : (
                <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                        No se encontraron pedidos con los filtros aplicados.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="flex items-center justify-between w-full">
                <div className="text-xs text-muted-foreground">
                    Mostrando <strong>{paginatedOrders.length}</strong> de <strong>{filteredOrders.length}</strong> pedidos.
                </div>
                 <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">{currentPage} de {totalPages}</span>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                 </div>
            </div>
        </CardFooter>
      </Card>
      
      <OrderDetailsDialog order={detailsOrder} isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
    </div>
  );
}
