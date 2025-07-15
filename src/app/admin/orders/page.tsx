
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { es } from 'date-fns/locale/es';

import {
  Banknote,
  CalendarIcon,
  Check,
  CreditCard,
  Landmark,
  MoreHorizontal,
  Coins,
  XCircle,
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
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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

function ApproveOrderDialog({ order, children }: { order: Order; children: React.ReactNode }) {
    const { approveOrder } = useOrdersStore();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = React.useState(false);

    const form = useForm<z.infer<typeof orderApprovalFormSchema>>({
        resolver: zodResolver(orderApprovalFormSchema),
        defaultValues: {
            paymentMethod: 'tarjeta',
        },
    });

    async function onSubmit(values: z.infer<typeof orderApprovalFormSchema>) {
        approveOrder({
            orderId: order.id,
            paymentMethod: values.paymentMethod,
            paymentDueDate: values.paymentDueDate
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

  const sortedOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const handleConfirmCancel = () => {
    if (!orderToCancel) return;

    // We only restock if the order wasn't already cancelled.
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


  return (
    <main className="grid flex-1 items-start gap-4">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Pedidos</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pedidos</CardTitle>
          <CardDescription>
            Una lista de todos los pedidos realizados en tu tienda.
          </CardDescription>
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
              {sortedOrders.length > 0 ? sortedOrders.map((order) => {
                const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || { label: 'Desconocido', color: 'bg-gray-100 text-gray-800'};
                return (
                    <TableRow key={order.id}>
                    <TableCell>
                        <div className="font-medium text-primary hover:underline cursor-pointer">{order.id}</div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{order.customer.name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer.phone}</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline">{order.source === 'pos' ? 'Punto de Venta' : 'Tienda Online'}</Badge>
                    </TableCell>
                    <TableCell>{format(parseISO(order.date), 'd MMM, yyyy')}</TableCell>
                    <TableCell>
                        {order.status !== 'pending-approval' ? (
                            <div className="flex items-center gap-2">
                                {paymentMethodIcons[order.paymentMethod as keyof typeof paymentMethodIcons]}
                                {paymentMethodLabels[order.paymentMethod as keyof typeof paymentMethodLabels]}
                            </div>
                        ) : (
                            <span className='text-sm text-muted-foreground'>N/A</span>
                        )}
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
                                        <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
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
                        No se han creado pedidos todavía.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Mostrando <strong>{orders.length}</strong> pedidos.
            </div>
        </CardFooter>
      </Card>
    </main>
  );
}
