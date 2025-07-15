
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/use-cart';
import { Header } from '@/components/header';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, Truck, MapPin, Store, CheckCircle, Banknote, CreditCard, Landmark } from 'lucide-react';
import { createOrder } from '@/ai/flows/create-order-flow';
import { useProductsStore } from '@/hooks/use-products';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';
import { useOrdersStore, type Address } from '@/hooks/use-orders';
import { useSettingsStore } from '@/hooks/use-settings-store';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { hondurasGeodata } from '@/lib/honduras-geodata';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const checkoutFormSchema = z.object({
  name: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }),
  phone: z.string().min(8, {
    message: 'El número de teléfono debe tener al menos 8 dígitos.',
  }),
  deliveryMethod: z.enum(['pickup', 'delivery'], {
    required_error: 'Debes seleccionar un método de entrega.',
  }),
  address: z.custom<Address>().optional(),
  paymentMethod: z.enum(['tarjeta', 'transferencia', 'efectivo'], {
    required_error: "Debes seleccionar un método de pago."
  }),
  paymentReference: z.string().optional(),
}).refine((data) => {
    if (data.deliveryMethod === 'delivery' && !data.address) {
        return false;
    }
    return true;
}, {
    message: 'La dirección de envío es obligatoria.',
    path: ['address'],
}).refine((data) => {
    if (data.paymentMethod === 'transferencia' && !data.paymentReference) {
        return false;
    }
    return true;
}, {
    message: "El número de referencia es obligatorio para pagos por transferencia.",
    path: ['paymentReference'],
});


function ShippingDialog({ 
    isOpen, 
    onOpenChange, 
    onSave,
    currentAddress 
}: { 
    isOpen: boolean; 
    onOpenChange: (open: boolean) => void;
    onSave: (address: Address, cost: number, type: 'local' | 'national') => void;
    currentAddress: Address | undefined;
}) {
    const { shippingLocalCost, shippingNationalCost } = useSettingsStore();

    const shippingFormSchema = z.object({
        shippingOption: z.enum(['local', 'national'], {
            required_error: 'Debes seleccionar una opción de envío.',
        }),
        department: z.string().optional(),
        municipality: z.string().optional(),
        colony: z.string().min(3, { message: 'La colonia/residencial debe tener al menos 3 caracteres.'}),
        exactAddress: z.string().min(10, { message: 'La dirección debe tener al menos 10 caracteres.' }),
    }).refine(data => {
        if (data.shippingOption === 'national') {
            return !!data.department && !!data.municipality;
        }
        return true;
    }, {
        message: 'Departamento y municipio son obligatorios para envíos nacionales.',
        path: ['department'], // You can point to one of the fields
    });

    const form = useForm<z.infer<typeof shippingFormSchema>>({
        resolver: zodResolver(shippingFormSchema),
        defaultValues: {
            shippingOption: (currentAddress as any)?.type || 'local',
            department: currentAddress?.department || undefined,
            municipality: currentAddress?.municipality || undefined,
            colony: currentAddress?.colony || '',
            exactAddress: currentAddress?.exactAddress || '',
        }
    });

    const selectedDepartment = form.watch('department');
    const selectedShippingOption = form.watch('shippingOption');
    
    useEffect(() => {
      const isNational = selectedShippingOption === 'national';
      if (isNational) {
          if (form.getValues('department') === 'Francisco Morazán') {
              form.setValue('department', undefined);
              form.setValue('municipality', undefined);
          }
      } else {
          form.setValue('department', 'Francisco Morazán');
          form.setValue('municipality', 'Distrito Central');
          form.clearErrors('department');
          form.clearErrors('municipality');
      }
    }, [selectedShippingOption, form]);

    const handleSave = (values: z.infer<typeof shippingFormSchema>) => {
        const cost = values.shippingOption === 'local' ? shippingLocalCost : shippingNationalCost;
        onSave({
            department: values.department || 'Francisco Morazán',
            municipality: values.municipality || 'Distrito Central',
            colony: values.colony,
            exactAddress: values.exactAddress,
        }, cost, values.shippingOption);
        onOpenChange(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Información de Envío</DialogTitle>
                    <DialogDescription>
                        Completa los detalles para la entrega a domicilio.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} id="shipping-form" className="space-y-4 pt-4">
                        <FormField
                          control={form.control}
                          name="shippingOption"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Tipo de Envío</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                >
                                  <FormItem>
                                    <FormControl>
                                      <label className={cn('flex flex-col justify-center items-center gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 min-h-[100px]', field.value === 'local' && 'bg-accent border-primary')}>
                                        <RadioGroupItem value="local" className="sr-only" />
                                        <MapPin className="h-6 w-6 text-primary" />
                                        <div className="text-center">
                                          <p className="font-semibold">Local</p>
                                          <p className="text-xs text-muted-foreground">(TGU)</p>
                                        </div>
                                      </label>
                                    </FormControl>
                                  </FormItem>
                                  <FormItem>
                                    <FormControl>
                                      <label className={cn('flex flex-col justify-center items-center gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 min-h-[100px]', field.value === 'national' && 'bg-accent border-primary')}>
                                        <RadioGroupItem value="national" className="sr-only"/>
                                        <Truck className="h-6 w-6 text-primary" />
                                        <div className="text-center">
                                          <p className="font-semibold">Nacional</p>
                                        </div>
                                      </label>
                                    </FormControl>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {selectedShippingOption === 'national' ? (
                            <>
                                <FormField
                                    control={form.control}
                                    name="department"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Departamento</FormLabel>
                                        <Select onValueChange={(value) => { field.onChange(value); form.setValue('municipality', ''); }} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un departamento" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {hondurasGeodata.map(depto => (
                                            <SelectItem key={depto.id} value={depto.nombre}>{depto.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="municipality"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Municipio</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDepartment}>
                                        <FormControl>
                                            <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un municipio" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {selectedDepartment && hondurasGeodata.find(d => d.nombre === selectedDepartment)?.municipios.map(muni => (
                                            <SelectItem key={muni.id} value={muni.nombre}>{muni.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </>
                        ) : null}
                        <FormField
                            control={form.control}
                            name="colony"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Colonia / Residencial</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Colonia Kennedy" {...field}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="exactAddress"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dirección Exacta</FormLabel>
                                <FormControl>
                                <Textarea placeholder="Bloque, número de casa, referencias, etc." {...field}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </form>
                </Form>
                <DialogFooter className="pt-4">
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" form="shipping-form">Guardar Dirección</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function CheckoutPage() {
  const { items, total, subtotal, taxAmount, shippingCost, setShippingCost, clearCart, toggleCart } = useCart();
  const { decreaseStock } = useProductsStore();
  const { addOrder } = useOrdersStore();
  const { taxRate, pickupAddress } = useSettingsStore();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const { currency } = useCurrencyStore();

  const form = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  const deliveryMethod = form.watch('deliveryMethod');
  const paymentMethod = form.watch('paymentMethod');
  const address = form.watch('address');

  useEffect(() => {
    // Reset shipping cost when delivery method changes
    if (deliveryMethod === 'pickup') {
      setShippingCost(0);
      form.setValue('address', undefined);
      form.clearErrors('address');
    } else if (deliveryMethod === 'delivery' && !address) {
       setShippingCost(0);
    }
  }, [deliveryMethod, setShippingCost, form, address]);
  
  // Clean up shipping cost on unmount
  useEffect(() => {
    return () => {
        setShippingCost(0);
    }
  }, [setShippingCost]);

  const handleSaveShippingInfo = (address: Address, cost: number, type: 'local' | 'national') => {
    // Add a 'type' property to address to remember the choice for re-editing
    const addressWithTye = { ...address, type };
    form.setValue('address', addressWithTye as Address);
    setShippingCost(cost);
  };

  async function onSubmit(values: z.infer<typeof checkoutFormSchema>) {
    setIsSubmitting(true);
    try {
      const orderInput = {
        customer: { 
          name: values.name || 'Consumidor Final', 
          phone: values.phone || 'N/A',
          address: values.deliveryMethod === 'delivery' ? values.address : undefined,
        },
        items: items.map(item => ({ ...item, quantity: item.quantity, stock: item.stock, category: item.category, description: item.description })),
        total: total,
        shippingCost: shippingCost,
        paymentMethod: values.paymentMethod,
        paymentReference: values.paymentReference,
        deliveryMethod: values.deliveryMethod,
      };

      const result = await createOrder(orderInput);

      if (result.success) {
        items.forEach(item => {
          decreaseStock(item.id, item.quantity);
        });
        
        addOrder({
          id: result.orderId,
          customer: orderInput.customer,
          items: orderInput.items,
          total: orderInput.total,
          shippingCost: orderInput.shippingCost,
          paymentMethod: orderInput.paymentMethod,
          paymentReference: orderInput.paymentReference, 
          date: new Date().toISOString(),
          status: 'pending-approval',
          source: 'online-store',
          deliveryMethod: orderInput.deliveryMethod,
        });

        toast({
          title: '¡Pedido Recibido!',
          description: 'Gracias por tu compra. Tu pedido está siendo procesado.',
        });
        clearCart();
        router.push(`/order-confirmation/${result.orderId}`);
      } else {
        throw new Error('La creación del pedido falló');
      }
    } catch (error) {
      console.error('Error al crear el pedido:', error);
      toast({
        title: '¡Oh no! Algo salió mal.',
        description: 'Hubo un problema al realizar tu pedido. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-grow container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Tu carrito está vacío</h1>
          <p className="text-muted-foreground mb-8">
            Parece que aún no has añadido nada a tu carrito.
          </p>
          <Button asChild>
            <Link href="/">Continuar Comprando</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex flex-col container mx-auto px-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold text-center py-8">Finalizar Compra</h1>
            
            <div className="flex-grow flex items-center justify-center">
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>1. Información de Contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input placeholder="(123) 456-7890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>2. Método de Entrega</CardTitle>
                       <FormMessage>{form.formState.errors.address?.message}</FormMessage>
                    </CardHeader>
                     <CardContent>
                        <Controller
                            control={form.control}
                            name="deliveryMethod"
                            render={({ field }) => (
                               <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="grid grid-cols-1 gap-4"
                                >
                                    <label className={cn("flex flex-col gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent/50", field.value === 'pickup' && "bg-accent border-primary")}>
                                        <div className="flex items-center gap-4">
                                            <RadioGroupItem value="pickup" id="pickup"/>
                                            <div className="flex-1 flex items-center gap-2">
                                                <Store className="h-5 w-5"/>
                                                <p className="font-semibold">Recoger en Tienda</p>
                                            </div>
                                            <p className="font-bold">GRATIS</p>
                                        </div>
                                        {field.value === 'pickup' && (
                                            <div className="pl-8 pt-2 text-sm text-muted-foreground">
                                                <p className='font-medium'>Dirección de Recogida:</p>
                                                <p>{pickupAddress}</p>
                                            </div>
                                        )}
                                    </label>

                                     <label className={cn("flex flex-col gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent/50", field.value === 'delivery' && "bg-accent border-primary")}>
                                        <div className="flex items-center gap-4">
                                            <RadioGroupItem value="delivery" id="delivery"/>
                                            <div className="flex-1 flex items-center gap-2">
                                                <Truck className="h-5 w-5"/>
                                                <p className="font-semibold">Envío a Domicilio</p>
                                            </div>
                                        </div>
                                         {field.value === 'delivery' && (
                                            <div className="pl-8 pt-2 text-sm">
                                                {address ? (
                                                    <div className='text-muted-foreground space-y-2'>
                                                        <div className='flex items-center gap-2 text-green-600 font-semibold'>
                                                           <CheckCircle className="h-5 w-5"/> Dirección guardada
                                                        </div>
                                                        <p className='font-medium'>{address.exactAddress}</p>
                                                        <p>{address.colony}</p>
                                                        <p>{address.municipality}, {address.department}</p>
                                                        <Button variant="link" className="p-0 h-auto" type="button" onClick={() => setIsShippingDialogOpen(true)}>Editar Dirección</Button>
                                                    </div>
                                                ) : (
                                                    <Button type="button" onClick={() => setIsShippingDialogOpen(true)}>Añadir Dirección de Envío</Button>
                                                )}
                                            </div>
                                        )}
                                    </label>
                                </RadioGroup>
                            )}
                        />
                     </CardContent>
                  </Card>

                   <Card>
                    <CardHeader>
                      <CardTitle>3. Método de Pago</CardTitle>
                       <FormMessage>{form.formState.errors.paymentMethod?.message}</FormMessage>
                    </CardHeader>
                     <CardContent>
                        <Controller
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                               <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="grid grid-cols-1 gap-4"
                                >
                                    <label className={cn("flex flex-col gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent/50", field.value === 'tarjeta' && "bg-accent border-primary")}>
                                        <div className="flex items-center gap-4">
                                            <RadioGroupItem value="tarjeta" id="tarjeta"/>
                                            <div className="flex-1 flex items-center gap-2">
                                                <CreditCard className="h-5 w-5"/>
                                                <p className="font-semibold">Pago con Tarjeta (Próximamente)</p>
                                            </div>
                                        </div>
                                         <p className="pl-8 pt-2 text-sm text-muted-foreground">
                                           Serás contactado para completar el pago de forma segura.
                                        </p>
                                    </label>
                                     <label className={cn("flex flex-col gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent/50", field.value === 'transferencia' && "bg-accent border-primary")}>
                                        <div className="flex items-center gap-4">
                                            <RadioGroupItem value="transferencia" id="transferencia"/>
                                            <div className="flex-1 flex items-center gap-2">
                                                <Landmark className="h-5 w-5"/>
                                                <p className="font-semibold">Transferencia Bancaria</p>
                                            </div>
                                        </div>
                                        {field.value === 'transferencia' && (
                                            <div className="pl-8 pt-2">
                                                <FormField
                                                    control={form.control}
                                                    name="paymentReference"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Número de Referencia</FormLabel>
                                                            <FormControl>
                                                            <Input placeholder="Ej: 987654321" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </label>
                                     <label className={cn("flex flex-col gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent/50", field.value === 'efectivo' && "bg-accent border-primary")}>
                                        <div className="flex items-center gap-4">
                                            <RadioGroupItem value="efectivo" id="efectivo"/>
                                            <div className="flex-1 flex items-center gap-2">
                                                <Banknote className="h-5 w-5"/>
                                                <p className="font-semibold">Efectivo (Pago contra entrega)</p>
                                            </div>
                                        </div>
                                    </label>
                                </RadioGroup>
                            )}
                        />
                     </CardContent>
                  </Card>
                </div>

                {/* Order Summary */}
                <div>
                  <h2 className="text-2xl font-bold mb-6">Resumen del Pedido</h2>
                  <div className="bg-muted/30 rounded-lg p-6">
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="relative h-16 w-16 rounded-md overflow-hidden">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                              {item.quantity}
                            </div>
                          </div>
                          <div className="flex-grow">
                            <p className="font-semibold text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.price, currency.code)}
                            </p>
                          </div>
                          <p className="font-semibold text-sm">
                            {formatCurrency(item.price * item.quantity, currency.code)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-6" />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <p>Subtotal</p>
                        <p>{formatCurrency(subtotal, currency.code)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p>ISV ({taxRate * 100}%)</p>
                        <p>{formatCurrency(taxAmount, currency.code)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p>Envío</p>
                        <p>{shippingCost > 0 ? formatCurrency(shippingCost, currency.code) : (deliveryMethod === 'pickup' ? 'GRATIS' : 'Selecciona una opción')}</p>
                      </div>
                    </div>
                    <Separator className="my-6" />
                    <div className="flex justify-between text-lg font-bold">
                      <p>Total</p>
                      <p>{formatCurrency(total, currency.code)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer className="py-6 flex flex-col items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                <Link href="/" className={cn(buttonVariants({ variant: 'outline', size: 'lg'}), 'w-full')}>
                  Continuar Comprando
                </Link>
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Pedido
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground max-w-lg">
                Tu pedido será confirmado por un administrador. No se te cobrará hasta que sea aprobado.
              </p>
            </footer>
          </form>
        </Form>
        
        <ShippingDialog 
            isOpen={isShippingDialogOpen}
            onOpenChange={setIsShippingDialogOpen}
            onSave={handleSaveShippingInfo}
            currentAddress={address}
        />
      </main>
    </div>
  );
}
