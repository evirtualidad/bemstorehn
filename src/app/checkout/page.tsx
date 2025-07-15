
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
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createOrder } from '@/ai/flows/create-order-flow';
import { useProductsStore } from '@/hooks/use-products';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';
import { useOrdersStore } from '@/hooks/use-orders';
import { useSettingsStore } from '@/hooks/use-settings-store';

const checkoutFormSchema = z.object({
  name: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }),
  phone: z.string().min(8, {
    message: 'El número de teléfono debe tener al menos 8 dígitos.',
  }),
});

export default function CheckoutPage() {
  const { items, total, subtotal, taxAmount, clearCart } = useCart();
  const { decreaseStock } = useProductsStore();
  const { addOrder } = useOrdersStore();
  const { taxRate } = useSettingsStore();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currency } = useCurrencyStore();

  const form = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  async function onSubmit(values: z.infer<typeof checkoutFormSchema>) {
    setIsSubmitting(true);
    try {
      const orderInput = {
        customer: { name: values.name || 'Consumidor Final', phone: values.phone || 'N/A' },
        items: items.map(item => ({ ...item, quantity: item.quantity, stock: item.stock, category: item.category, description: item.description })),
        total: total,
        paymentMethod: 'tarjeta' as const, // Placeholder, admin will set the final one
      };

      const result = await createOrder(orderInput);

      if (result.success) {
        // Decrease stock as soon as the order is placed
        items.forEach(item => {
          decreaseStock(item.id, item.quantity);
        });
        
        // Add order to the store with 'pending-approval' status
        addOrder({
          id: result.orderId,
          customer: orderInput.customer,
          items: orderInput.items,
          total: orderInput.total,
          paymentMethod: 'tarjeta', // This is temporary
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
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-10">Finalizar Compra</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Customer Info Form */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Información de Contacto</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Pedido para Aprobación
                </Button>
                 <p className="text-xs text-center text-muted-foreground">
                    Tu pedido será confirmado por un administrador. No se te cobrará hasta que sea aprobado.
                </p>
              </form>
            </Form>
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
                  <p>Gratis</p>
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
      </main>
    </div>
  );
}

    
