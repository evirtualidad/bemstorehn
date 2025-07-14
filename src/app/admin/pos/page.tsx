
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
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
import { CalendarIcon, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';


type PosCartItem = Product & { quantity: number };

const checkoutFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre es obligatorio.' }),
  phone: z.string().optional(),
  paymentMethod: z.enum(['efectivo', 'tarjeta', 'transferencia', 'credito'], {
    required_error: 'Debes seleccionar una forma de pago.',
  }),
  paymentDueDate: z.date().optional(),
  cashAmount: z.coerce.number().optional(),
  paymentReference: z.string().optional(),
})
.refine(
  (data) => {
    if (data.paymentMethod === 'credito' && !data.paymentDueDate) {
      return false;
    }
    return true;
  },
  {
    message: 'La fecha de pago es obligatoria para pagos a crédito.',
    path: ['paymentDueDate'],
  }
)
.refine(
  (data) => {
    if (data.paymentMethod === 'efectivo' && data.cashAmount && data.total) {
       return data.cashAmount >= data.total;
    }
    return true;
  },
  {
    message: 'El efectivo recibido debe ser mayor o igual al total.',
    path: ['cashAmount'],
  }
);


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

  const total = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const form = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { name: '', phone: '', paymentMethod: 'efectivo', total },
  });
  
  React.useEffect(() => {
    form.setValue('total', total);
  }, [total, form]);


  const { paymentMethod, cashAmount } = form.watch();

  const change = React.useMemo(() => {
    if (paymentMethod === 'efectivo' && cashAmount && cashAmount > total) {
      return cashAmount - total;
    }
    return 0;
  }, [paymentMethod, cashAmount, total]);

  const handleProductSelect = (product: Product) => {
    if(product.stock <= 0) {
      toast({
        title: 'Producto Agotado',
        description: `${product.name} no tiene stock disponible.`,
        variant: 'destructive',
      });
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if(existingItem.quantity < product.stock) {
          return prevCart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
           toast({
            title: 'Stock Máximo Alcanzado',
            description: `No puedes añadir más ${product.name}.`,
            variant: 'destructive',
          });
          return prevCart;
        }
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, amount: number) => {
    setCart((prevCart) => {
      const itemToUpdate = prevCart.find(item => item.id === productId);
      if (!itemToUpdate) return prevCart;

      const newQuantity = itemToUpdate.quantity + amount;

      if (newQuantity > itemToUpdate.stock) {
         toast({
          title: 'Stock Insuficiente',
          description: `Solo hay ${itemToUpdate.stock} unidades de ${itemToUpdate.name}.`,
          variant: 'destructive',
        });
        return prevCart;
      }

      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== productId);
      }
      
      return prevCart.map(item =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const clearCartAndForm = () => {
    setCart([]);
    form.reset({ name: '', phone: '', paymentMethod: 'efectivo', paymentDueDate: undefined, cashAmount: undefined, paymentReference: '' });
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
        paymentMethod: values.paymentMethod,
        paymentDueDate: values.paymentDueDate ? values.paymentDueDate.toISOString() : undefined,
        cashAmount: values.cashAmount,
        paymentReference: values.paymentReference,
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
       <ScrollArea className="h-full">
        <Card className="flex-1 rounded-none border-0 border-b">
          <CardHeader>
            <CardTitle>Ticket de Venta</CardTitle>
            <CardDescription>Productos añadidos al pedido actual.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="min-h-[200px]">
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
             </div>
            <Separator className='my-4'/>
             <div className="flex justify-between text-xl font-bold">
                <p>Total</p>
                <p>${total.toFixed(2)}</p>
              </div>
               {paymentMethod === 'efectivo' && cashAmount && change > 0 && (
                <div className="flex justify-between text-lg font-medium mt-2 text-muted-foreground">
                    <p>Cambio</p>
                    <p>${change.toFixed(2)}</p>
                </div>
              )}
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
                 <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Forma de Pago</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="efectivo" /></FormControl>
                            <FormLabel className="font-normal">Efectivo</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="tarjeta" /></FormControl>
                            <FormLabel className="font-normal">Tarjeta de Débito/Crédito</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="transferencia" /></FormControl>
                            <FormLabel className="font-normal">Transferencia</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="credito" /></FormControl>
                            <FormLabel className="font-normal">Al Crédito</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {paymentMethod === 'efectivo' && (
                  <FormField
                    control={form.control}
                    name="cashAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Efectivo Recibido</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ej: 50.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {(paymentMethod === 'tarjeta' || paymentMethod === 'transferencia') && (
                  <FormField
                    control={form.control}
                    name="paymentReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referencia de Pago</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {paymentMethod === 'credito' && (
                  <FormField
                    control={form.control}
                    name="paymentDueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Pago</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP', { locale: es })
                                ) : (
                                  <span>Selecciona una fecha</span>
                                )}
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
                              disabled={(date) =>
                                date < new Date() || date < new Date('1900-01-01')
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
       </ScrollArea>
      </div>
    </div>
  );
}
