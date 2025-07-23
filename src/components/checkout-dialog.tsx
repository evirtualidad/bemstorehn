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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePosCart } from '@/hooks/use-pos-cart';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';
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
import { Banknote, CreditCard, Landmark, Coins } from 'lucide-react';
import { useOrdersStore, type NewOrderData } from '@/hooks/use-orders';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/hooks/use-auth-store';

const checkoutFormSchema = z.object({
  name: z.string(), // Name can be empty initially, will be defaulted later
  phone: z.string().optional(),
  paymentMethod: z.enum(['efectivo', 'tarjeta', 'transferencia', 'credito'], {
    required_error: "Debes seleccionar un método de pago."
  }),
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

    const form = useForm<z.infer<typeof checkoutFormSchema>>({
        resolver: zodResolver(checkoutFormSchema),
        defaultValues: {
            name: '',
            phone: '',
            paymentMethod: 'efectivo',
        },
    });
    
    React.useEffect(() => {
        if (!isOpen) {
            form.reset({
                name: '',
                phone: '',
                paymentMethod: 'efectivo',
            });
            setSelectedCustomer(null);
        }
    }, [isOpen, form]);

    const handleCustomerSelect = (customer: Customer | null) => {
        setSelectedCustomer(customer);
        if (customer) {
            form.setValue('name', customer.name);
            form.setValue('phone', customer.phone || '');
        }
    };

    const onSubmit = async (values: z.infer<typeof checkoutFormSchema>) => {
        const finalCustomerName = values.name.trim() === '' ? 'Consumidor Final' : values.name;

        const customerId = await addOrUpdateCustomer({
            name: finalCustomerName,
            phone: values.phone
        });

        if (customerId) {
            await addPurchaseToCustomer(customerId, total);
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
            payment_due_date: null,
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
            <DialogContent className="rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Completar Venta</DialogTitle>
                    <DialogDescription>
                        Confirma los detalles del cliente y el método de pago.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <CustomerSearch onCustomerSelect={handleCustomerSelect} form={form} />
                        
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teléfono (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: 9988-7766" {...field} className="rounded-lg" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                                    className="flex flex-col h-20 rounded-lg"
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
