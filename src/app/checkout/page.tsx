
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { Loader2, Truck, MapPin } from 'lucide-react';
import { createOrder } from '@/ai/flows/create-order-flow';
import { useProductsStore } from '@/hooks/use-products';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';
import { useOrdersStore } from '@/hooks/use-orders';
import { useSettingsStore } from '@/hooks/use-settings-store';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { hondurasGeodata } from '@/lib/honduras-geodata';

const checkoutFormSchema = z.object({
  name: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }),
  phone: z.string().min(8, {
    message: 'El número de teléfono debe tener al menos 8 dígitos.',
  }),
  shippingOption: z.enum(['local', 'national'], {
    required_error: 'Debes seleccionar una opción de envío.',
  }),
  department: z.string({ required_error: 'Debes seleccionar un departamento.' }),
  municipality: z.string({ required_error: 'Debes seleccionar un municipio.' }),
  exactAddress: z.string().min(10, { message: 'La dirección debe tener al menos 10 caracteres.' }),
});

export default function CheckoutPage() {
  const { items, total, subtotal, taxAmount, shippingCost, setShippingCost, clearCart, toggleCart } = useCart();
  const { decreaseStock } = useProductsStore();
  const { addOrder } = useOrdersStore();
  const { taxRate, shippingLocalCost, shippingNationalCost } = useSettingsStore();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currency } = useCurrencyStore();

  const form = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      exactAddress: '',
    },
  });

  const selectedShippingOption = form.watch('shippingOption');
  const selectedDepartment = form.watch('department');

  useEffect(() => {
    if (selectedShippingOption === 'local') {
      setShippingCost(shippingLocalCost);
    } else if (selectedShippingOption === 'national') {
      setShippingCost(shippingNationalCost);
    } else {
      setShippingCost(0);
    }
  }, [selectedShippingOption, setShippingCost, shippingLocalCost, shippingNationalCost]);
  
  useEffect(() => {
    return () => {
        setShippingCost(0);
    }
  }, [setShippingCost]);

  async function onSubmit(values: z.infer<typeof checkoutFormSchema>) {
    setIsSubmitting(true);
    try {
      const orderInput = {
        customer: { 
          name: values.name || 'Consumidor Final', 
          phone: values.phone || 'N/A',
          address: {
            department: values.department,
            municipality: values.municipality,
            exactAddress: values.exactAddress,
          }
        },
        items: items.map(item => ({ ...item, quantity: item.quantity, stock: item.stock, category: item.category, description: item.description })),
        total: total,
        shippingCost: shippingCost,
        paymentMethod: 'tarjeta' as const, 
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
          paymentMethod: 'tarjeta', 
          date: new Date().toISOString(),
          status: 'pending-approval',
          source: 'online-store',
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
            <a href="/">Continuar Comprando</a>
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
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Información de Contacto</h2>
                    <div className="space-y-6">
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
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Información de Envío</h2>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="shippingOption"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Opción de Envío</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                              >
                                <FormItem>
                                  <FormControl>
                                    <label className={cn("flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent/50", field.value === 'local' && "bg-accent border-primary")}>
                                      <RadioGroupItem value="local" />
                                      <MapPin className="h-6 w-6 text-primary"/>
                                      <div className="flex-1">
                                        <p className="font-semibold">Local (TGU)</p>
                                      </div>
                                      <p className="font-bold">{formatCurrency(shippingLocalCost, currency.code)}</p>
                                    </label>
                                  </FormControl>
                                </FormItem>
                                <FormItem>
                                  <FormControl>
                                      <label className={cn("flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent/50", field.value === 'national' && "bg-accent border-primary")}>
                                      <RadioGroupItem value="national" />
                                      <Truck className="h-6 w-6 text-primary"/>
                                      <div className="flex-1">
                                        <p className="font-semibold">Nacional</p>
                                      </div>
                                      <p className="font-bold">{formatCurrency(shippingNationalCost, currency.code)}</p>
                                    </label>
                                  </FormControl>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departamento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedDepartment}>
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
                       <FormField
                        control={form.control}
                        name="exactAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección Exacta</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Colonia, calle, número de casa, referencias..." {...field}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
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
                        <p>{shippingCost > 0 ? formatCurrency(shippingCost, currency.code) : 'Selecciona una opción'}</p>
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
      </main>
    </div>
  );
}
