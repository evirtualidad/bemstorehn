
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useProductsStore } from '@/hooks/use-products';
import { createOrder } from '@/ai/flows/create-order-flow';
import type { Product } from '@/lib/products';
import Image from 'next/image';
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type PosCartItem = Product & { quantity: number };

const checkoutFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre es obligatorio.' }),
  phone: z.string().optional(),
});

function ProductGrid({ onProductSelect }: { onProductSelect: (product: Product) => void }) {
  const { products } = useProductsStore();

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {products.map((product) => (
          <Card
            key={product.id}
            onClick={() => onProductSelect(product)}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <Image
                  src={product.image || 'https://placehold.co/200x200.png'}
                  alt={product.name}
                  fill
                  className="object-cover rounded-t-lg"
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

export default function PosPage() {
  const [cart, setCart] = React.useState<PosCartItem[]>([]);
  const { decreaseStock } = useProductsStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { name: '', phone: '' },
  });

  const handleProductSelect = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, amount: number) => {
    setCart((prevCart) => {
      const updatedCart = prevCart
        .map((item) => {
          if (item.id === productId) {
            return { ...item, quantity: item.quantity + amount };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
      return updatedCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const total = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const clearCartAndForm = () => {
    setCart([]);
    form.reset();
  }

  async function onSubmit(values: z.infer<typeof checkoutFormSchema>) {
    if (cart.length === 0) {
      toast({
        title: 'Carrito Vacío',
        description: 'Añade productos antes de crear un pedido.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrder({
        customer: { name: values.name, phone: values.phone || 'N/A' },
        items: cart,
        total: total,
      });

      if (result.success) {
        cart.forEach((item) => decreaseStock(item.id, item.quantity));
        toast({
          title: '¡Pedido Creado!',
          description: `Pedido ${result.orderId} creado con éxito.`,
        });
        clearCartAndForm();
      } else {
        throw new Error('La creación del pedido falló');
      }
    } catch (error) {
      console.error('Error al crear el pedido:', error);
      toast({
        title: 'Error al crear pedido',
        description: 'Hubo un problema al crear el pedido. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid md:grid-cols-[2fr_1fr] h-full">
      <div className="border-r bg-muted/20">
        <ProductGrid onProductSelect={handleProductSelect} />
      </div>

      <div className="flex flex-col">
        <Card className="flex-1 rounded-none border-0 border-b">
          <CardHeader>
            <CardTitle>Ticket de Venta</CardTitle>
            <CardDescription>Productos añadidos al pedido actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">
                  Selecciona productos para empezar
                </p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                       <div className="flex-1">
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                       </div>
                       <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3"/></Button>
                          <span className='w-6 text-center'>{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                       </div>
                       <p className="w-16 text-right font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeFromCart(item.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <Separator className='my-4'/>
             <div className="flex justify-between text-xl font-bold">
                <p>Total</p>
                <p>${total.toFixed(2)}</p>
              </div>
          </CardContent>
        </Card>
        <Card className="flex-1 rounded-none border-0">
          <CardHeader>
            <CardTitle>Cliente y Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre completo" {...field} />
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
                      <FormLabel>Teléfono (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Número de teléfono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" className='w-full' onClick={clearCartAndForm} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" className="w-full" disabled={isSubmitting || cart.length === 0}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear Pedido
                    </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
