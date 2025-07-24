
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePosCart } from '@/hooks/use-pos-cart';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency, cn } from '@/lib/utils';
import { CustomerSearch } from './customer-search';
import { useCustomersStore, type Customer } from '@/hooks/use-customers';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Banknote, CreditCard, Landmark, Coins, User, UserSearch, CalendarIcon } from 'lucide-react';
import { useOrdersStore, type NewOrderData } from '@/hooks/use-orders';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/hooks/use-auth-store';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

const checkoutFormSchema = z.object({
  name: z.string(),
  phone: z.string().optional(),
  paymentMethod: z.enum(['efectivo', 'tarjeta', 'transferencia', 'credito'], {
    required_error: "Debes seleccionar un método de pago."
  }),
  paymentDueDate: z.date().optional(),
}).refine(data => {
    if (data.paymentMethod === 'credito') {
        return !!data.paymentDueDate;
    }
    return true;
}, {
    message: 'La fecha de pago es obligatoria para pagos a crédito.',
    path: ['paymentDueDate'],
}).refine(data => {
    if (data.paymentMethod === 'credito' && (data.name.trim().toLowerCase() === 'consumidor final' || data.name.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: 'El nombre del cliente es obligatorio para ventas a crédito.',
    path: ['name'],
}).refine(data => {
    if (data.paymentMethod === 'credito' && (!data.phone || data.phone.trim().length < 8)) {
        return false;
    }
    return true;
}, {
    message: 'El teléfono (mín. 8 dígitos) es obligatorio para ventas a crédito.',
    path: ['phone'],
});


interface CheckoutDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCheckoutSuccess: () => void;
}

export function CheckoutDialog({ isOpen, onOpenChange, onCheckoutSuccess }: CheckoutDialogProps) {
    const { items, total } = usePosCart();
    const { currency } = useCurrencyStore();
    const { addOrUpdateCustomer, addPurchaseToCustomer } = useCustomersStore();
    const { createOrder } = useOrdersStore();
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
    const [customerType, setCustomerType] = React.useState<'consumidorFinal' | 'specific'>('consumidorFinal');
    const [today, setToday] = React.useState<Date | null>(null);

    const form = useForm<z.infer<typeof checkoutFormSchema>>({
        resolver: zodResolver(checkoutFormSchema),
        defaultValues: {
            name: 'Consumidor Final',
            phone: '',
            paymentMethod: 'efectivo',
            paymentDueDate: undefined,
        },
    });

    const selectedPaymentMethod = form.watch('paymentMethod');

    React.useEffect(() => {
        if (selectedPaymentMethod === 'credito' && customerType !== 'specific') {
            setCustomerType('specific');
            form.setValue('name', '');
            form.setValue('phone', '');
        }
    }, [selectedPaymentMethod, customerType, form]);

    React.useEffect(() => {
        if (isOpen) {
            setToday(new Date());
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (!isOpen) {
            form.reset({
                name: 'Consumidor Final',
                phone: '',
                paymentMethod: 'efectivo',
                paymentDueDate: undefined,
            });
            setSelectedCustomer(null);
            setCustomerType('consumidorFinal');
        } else {
             form.setValue('name', 'Consumidor Final');
             form.setValue('phone', '');
        }
    }, [isOpen, form]);

    const handleCustomerSelect = (customer: Customer | null) => {
        setSelectedCustomer(customer);
        if (customer) {
            form.setValue('name', customer.name);
            form.setValue('phone', customer.phone || '');
        }
    };
    
    const handleCustomerTypeChange = (type: 'consumidorFinal' | 'specific') => {
        setCustomerType(type);
        if (type === 'consumidorFinal') {
            form.setValue('name', 'Consumidor Final');
            form.setValue('phone', '');
            setSelectedCustomer(null);
        } else {
            form.setValue('name', '');
            form.setValue('phone', '');
        }
    }


    const onSubmit = async (values: z.infer<typeof checkoutFormSchema>) => {
        const finalCustomerName = values.name.trim() === '' ? 'Consumidor Final' : values.name;

        const customerId = await addOrUpdateCustomer({
            name: finalCustomerName,
            phone: values.phone
        });

        if (customerId) {
            const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
            await addPurchaseToCustomer(customerId, total, totalQuantity);
        }
        
        const newOrderData: NewOrderData = {
            user_id: user?.id || null,
            customer_id: customerId,
            customer_name: finalCustomerName,
            customer_phone: values.phone || '',
            customer_address: null,
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
            })),
            total: total,
            shipping_cost: 0,
            payment_method: values.paymentMethod,
            payment_reference: null,
            status: values.paymentMethod === 'credito' ? 'pending-payment' : 'paid',
            source: 'pos',
            delivery_method: 'pickup',
            balance: values.paymentMethod === 'credito' ? total : 0,
            payments: values.paymentMethod !== 'credito' ? [{ amount: total, date: new Date().toISOString(), method: values.paymentMethod }] : [],
            payment_due_date: values.paymentDueDate ? values.paymentDueDate.toISOString() : null,
        };
        
        const newOrderId = createOrder(newOrderData);

        if (newOrderId) {
            toast({
                title: "¡Venta Registrada!",
                description: `Se completó la venta a ${finalCustomerName} por ${formatCurrency(total, currency.code)}.`
            });
            
            onCheckoutSuccess();
        } else {
             toast({
                title: "Error al registrar la venta",
                description: "Hubo un problema al procesar el pedido. Por favor, inténtalo de nuevo.",
                variant: 'destructive',
            });
        }
    }
    
    const paymentMethods = [
        { value: 'efectivo', label: 'Efectivo', icon: Banknote },
        { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
        { value: 'transferencia', label: 'Transferencia', icon: Landmark },
        { value: 'credito', label: 'Crédito', icon: Coins },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-xl">
                <DialogHeader>
                    <DialogTitle>Completar Venta</DialogTitle>
                    <DialogDescription>
                        Confirma los detalles del cliente y el método de pago.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        
                        <div className="space-y-2">
                           <FormLabel>Cliente</FormLabel>
                           <div className="grid grid-cols-2 gap-2">
                               <Button 
                                type="button"
                                variant={customerType === 'consumidorFinal' ? 'secondary' : 'outline'}
                                onClick={() => handleCustomerTypeChange('consumidorFinal')}
                                className="h-12 rounded-xl"
                                disabled={selectedPaymentMethod === 'credito'}
                               >
                                  <User className="mr-2 h-4 w-4"/> Consumidor Final
                               </Button>
                               <Button 
                                type="button"
                                variant={customerType === 'specific' ? 'secondary' : 'outline'}
                                onClick={() => handleCustomerTypeChange('specific')}
                                className="h-12 rounded-xl"
                               >
                                 <UserSearch className="mr-2 h-4 w-4"/>  Buscar Cliente
                               </Button>
                           </div>
                        </div>

                        {customerType === 'specific' && (
                            <div className='space-y-4'>
                                <CustomerSearch onCustomerSelect={handleCustomerSelect} form={form} />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teléfono</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: 9988-7766" {...field} className="rounded-lg" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        
                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Método de Pago</FormLabel>
                                    <FormControl>
                                         <div className="grid grid-cols-2 gap-4">
                                            {paymentMethods.map(method => (
                                                 <Button
                                                    key={method.value}
                                                    type="button"
                                                    variant={field.value === method.value ? 'secondary' : 'outline'}
                                                    className="flex flex-col h-20 rounded-xl"
                                                    onClick={() => field.onChange(method.value)}
                                                  >
                                                     <method.icon className="mb-2 h-6 w-6" />
                                                     {method.label}
                                                 </Button>
                                            ))}
                                        </div>
                                    </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedPaymentMethod === 'credito' && (
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
                                                        className={cn("rounded-lg justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Selecciona fecha</span>}
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
                <DialogFooter className="mt-6">
                    <DialogClose asChild>
                        <Button variant="outline" className="rounded-full">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" form="checkout-form" className="rounded-full">
                        Confirmar Venta ({formatCurrency(total, currency.code)})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
