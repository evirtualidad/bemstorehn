
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
import { CalendarIcon, Loader2, Minus, Plus, Tag, Trash2, Users, Receipt, CreditCard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';
import { ProductSearch } from '@/components/product-search';

type PosCartItem = Product & { quantity: number };

const checkoutFormSchema = z
  .object({
    name: z.string().min(2, { message: 'El nombre es obligatorio.' }),
    phone: z.string().optional(),
    paymentMethod: z.enum(['efectivo', 'tarjeta', 'transferencia', 'credito'], {
      required_error: 'Debes seleccionar una forma de pago.',
    }),
    paymentDueDate: z.date().optional(),
    cashAmount: z.coerce.number().optional(),
    paymentReference: z.string().optional(),
    total: z.number().optional(),
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

function CategoryList({
  categories,
  selectedCategory,
  onSelectCategory,
}: {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}) {
  return (
    <nav className="flex flex-col gap-2">
      <Button
        variant={selectedCategory === null ? 'secondary' : 'ghost'}
        className="justify-start"
        onClick={() => onSelectCategory(null)}
      >
        <Tag className="mr-2 h-4 w-4" />
        Todas
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? 'secondary' : 'ghost'}
          className="justify-start"
          onClick={() => onSelectCategory(category)}
        >
          <Tag className="mr-2 h-4 w-4" />
          {category}
        </Button>
      ))}
    </nav>
  );
}

function ProductGrid({
  products,
  onProductSelect,
}: {
  products: Product[];
  onProductSelect: (product: Product) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <Card
          key={product.id}
          onClick={() => onProductSelect(product)}
          className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
        >
          <CardContent className="p-0">
            <div className="relative aspect-square">
              <Image
                src={product.image || 'https://placehold.co/200x200.png'}
                alt={product.name}
                fill
                className="object-cover"
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
  );
}

function TicketView({
  cart,
  total,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onCheckout,
}: {
  cart: PosCartItem[];
  total: number;
  onUpdateQuantity: (productId: string, amount: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}) {
  return (
    <div className="bg-muted/30 h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pedido Actual</h2>
            <Button variant="ghost" size="sm" onClick={onClearCart} disabled={cart.length === 0}>
                Borrar
            </Button>
        </div>
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-4">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">
              Selecciona productos para empezar
            </p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={48}
                  height={48}
                  className="rounded-md object-cover aspect-square"
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm leading-tight">{item.name}</p>
                  <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="w-16 text-right font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onRemoveFromCart(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background space-y-4">
        <div className="flex justify-between text-xl font-bold">
          <p>Total</p>
          <p>${total.toFixed(2)}</p>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={onCheckout}
          disabled={cart.length === 0}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          Facturar
        </Button>
      </div>
    </div>
  );
}


function CheckoutForm({ form, onSubmit, isSubmitting, onCancel, cart, total, change, isInDialog }: { form: any, onSubmit: (values: any) => void, isSubmitting: boolean, onCancel: () => void, cart: PosCartItem[], total: number, change: number, isInDialog?: boolean }) {
    const paymentMethod = form.watch('paymentMethod');

    const CancelButton = () => (
      <Button type="button" variant="outline" className='w-full sm:w-auto' onClick={onCancel} disabled={isSubmitting}>
        Cancelar
      </Button>
    );

    return (
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
                                {change > 0 && (
                                    <p className="text-sm text-muted-foreground pt-1">Cambio a devolver: ${change.toFixed(2)}</p>
                                )}
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
                <DialogFooter className='pt-4 sm:justify-between'>
                    {isInDialog ? (
                        <DialogClose asChild>
                           <CancelButton />
                        </DialogClose>
                    ) : (
                        <CancelButton />
                    )}
                    <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || cart.length === 0}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear Pedido
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

export default function PosPage() {
  const [cart, setCart] = React.useState<PosCartItem[]>([]);
  const { products, decreaseStock } = useProductsStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const categories = [...new Set(products.map((p) => p.category))];

  const filteredProducts = React.useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [selectedCategory, products]);

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
        setIsCheckoutOpen(false);
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
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_400px] h-screen max-h-screen overflow-hidden">
        {/* Left Panel: Categories */}
        <div className="hidden lg:block border-r bg-muted/20 p-4">
            <h2 className="text-lg font-semibold mb-4">Categorías</h2>
            <CategoryList
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
            />
        </div>

        {/* Middle Panel: Product Selection */}
        <main className="flex flex-col h-screen">
            <header className="p-4 border-b flex items-center gap-4">
                <h1 className="text-xl font-bold flex-1">Punto de Venta</h1>
                 <div className="w-full max-w-sm">
                    <ProductSearch onProductSelect={handleProductSelect} />
                 </div>
            </header>
            <ScrollArea className="flex-grow p-4">
                <div className="block lg:hidden mb-4">
                    <CategoryList
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                    />
                </div>
                <ProductGrid products={filteredProducts} onProductSelect={handleProductSelect} />
            </ScrollArea>
        </main>
        
        {/* Right Panel: Ticket */}
        <aside className="hidden lg:flex flex-col border-l">
             <TicketView
                cart={cart}
                total={total}
                onUpdateQuantity={updateQuantity}
                onRemoveFromCart={removeFromCart}
                onClearCart={clearCartAndForm}
                onCheckout={() => setIsCheckoutOpen(true)}
            />
        </aside>

        {/* Mobile Ticket / Checkout Trigger */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4">
             <div className="flex justify-between items-center text-lg font-bold mb-2">
                <p>Total</p>
                <p>${total.toFixed(2)}</p>
            </div>
             <Button
                size="lg"
                className="w-full"
                onClick={() => setIsCheckoutOpen(true)}
                disabled={cart.length === 0}
            >
                <CreditCard className="mr-2 h-5 w-5" />
                Facturar
            </Button>
        </div>


        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cliente y Pago</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] p-1">
                    <div className="p-4">
                         {/* Mobile Cart View inside Dialog */}
                        <div className="lg:hidden mb-6">
                            <h3 className="text-lg font-semibold mb-2">Resumen del Pedido</h3>
                            <ScrollArea className="max-h-48 border rounded-md">
                                <div className="p-2 space-y-2">
                                {cart.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 text-sm">
                                    <Image src={item.image} alt={item.name} width={40} height={40} className="rounded" />
                                    <div className="flex-1">
                                        <p className="font-medium truncate">{item.name}</p>
                                        <p className="text-muted-foreground">{item.quantity} x ${item.price.toFixed(2)}</p>
                                    </div>
                                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                                ))}
                                </div>
                            </ScrollArea>
                            <div className="flex justify-between text-lg font-bold mt-2">
                                <p>Total</p>
                                <p>${total.toFixed(2)}</p>
                            </div>
                             <Separator className="my-4" />
                        </div>
                       
                        <CheckoutForm 
                            form={form} 
                            onSubmit={onSubmit} 
                            isSubmitting={isSubmitting} 
                            onCancel={() => setIsCheckoutOpen(false)} 
                            cart={cart} 
                            total={total} 
                            change={change} 
                            isInDialog={true} />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    