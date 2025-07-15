
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
import { CalendarIcon, Loader2, Minus, Plus, Tag, Trash2, Users, Receipt, CreditCard, Banknote, Landmark, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';
import { ProductSearch } from '@/components/product-search';
import { useCategoriesStore } from '@/hooks/use-categories';

type PosCartItem = Product & { quantity: number };

const checkoutFormSchema = z
  .object({
    name: z.string().optional(),
    phone: z.string().optional(),
    paymentMethod: z.enum(['efectivo', 'tarjeta', 'transferencia', 'credito'], {
      required_error: 'Debes seleccionar una forma de pago.',
    }),
    paymentDueDate: z.date().optional(),
    cashAmount: z.string().optional(),
    total: z.number().optional(),
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
        return Number(data.cashAmount) >= data.total;
      }
      return true;
    },
    {
      message: 'El efectivo recibido debe ser mayor o igual al total.',
      path: ['cashAmount'],
    }
  ).refine(
    (data) => {
      if (data.paymentMethod === 'credito' && (!data.name || data.name.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'El nombre del cliente es obligatorio para pagos a crédito.',
      path: ['name'],
    }
  ).refine(
    (data) => {
      if (data.paymentMethod === 'credito' && (!data.phone || data.phone.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'El teléfono del cliente es obligatorio para pagos a crédito.',
      path: ['phone'],
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
  const { getCategoryByName } = useCategoriesStore();
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={selectedCategory === null ? 'default' : 'outline'}
        className="justify-start h-11 px-4"
        onClick={() => onSelectCategory(null)}
      >
        <Tag className="mr-2 h-4 w-4" />
        Todas
      </Button>
      {categories.map((categoryName) => {
        const category = getCategoryByName(categoryName);
        if (!category) return null;
        return (
          <Button
            key={category.id}
            variant={selectedCategory === category.name ? 'default' : 'outline'}
            className="justify-start h-11 px-4"
            onClick={() => onSelectCategory(category.name)}
          >
            {category.label}
          </Button>
        )
      })}
    </div>
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card
          key={product.id}
          onClick={() => onProductSelect(product)}
          className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group flex flex-col"
        >
          <CardContent className="p-0 flex-grow flex flex-col">
            <div className="relative aspect-square">
              <Image
                src={product.image || 'https://placehold.co/200x200.png'}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm leading-tight h-10">{product.name}</h3>
            </div>
             <div className="mt-auto bg-primary text-primary-foreground text-center p-2 rounded-b-md">
                <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
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
  onRemoveFromCart: (productId:string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}) {
  return (
    <aside className="fixed top-0 right-0 h-screen w-[420px] hidden lg:flex flex-col border-l z-10 bg-muted/40">
        <div className="p-4 border-b flex-shrink-0 bg-background">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Pedido Actual</h2>
                <Button variant="ghost" size="sm" onClick={onClearCart} disabled={cart.length === 0}>
                    Borrar
                </Button>
            </div>
        </div>
        <div className="flex-grow overflow-hidden bg-background">
            <ScrollArea className="h-full">
                {cart.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                    <p className="text-center text-muted-foreground p-10">
                        Selecciona productos para empezar
                    </p>
                </div>
                ) : (
                <div className="p-4 space-y-4">
                {cart.map((item) => (
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
                        <div className="flex items-center gap-2 mt-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(item.id, -1)}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center text-md font-bold">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(item.id, 1)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                    <p className="w-16 text-right font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onRemoveFromCart(item.id)}>
                        <Trash2 className="h-5 w-5" />
                    </Button>
                    </div>
                ))}
                </div>
                )}
            </ScrollArea>
        </div>
        <div className="p-4 border-t bg-background space-y-4 flex-shrink-0">
            <div className="flex justify-between text-xl font-bold">
            <p>Total</p>
            <p>${total.toFixed(2)}</p>
            </div>
            <Button
            size="lg"
            className="w-full h-12 text-lg"
            onClick={onCheckout}
            disabled={cart.length === 0}
            >
            <CreditCard className="mr-2 h-5 w-5" />
            Facturar
            </Button>
        </div>
    </aside>
  );
}

function MobileTicketView({
  cart,
  total,
  isVisible,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onCheckout,
  onClose,
}: {
  cart: PosCartItem[];
  total: number;
  isVisible: boolean;
  onUpdateQuantity: (productId: string, amount: number) => void;
  onRemoveFromCart: (productId:string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onClose: () => void;
}) {
  if (!isVisible) return null;

  return (
    <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={onClose}>
        <div 
            className="fixed bottom-0 left-0 right-0 h-[60vh] flex flex-col bg-muted/40 rounded-t-2xl"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-4 border-b flex-shrink-0 bg-background rounded-t-2xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Pedido Actual</h2>
                     <div className='flex items-center gap-2'>
                        <Button variant="ghost" size="sm" onClick={onClearCart} disabled={cart.length === 0}>
                            Borrar
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
            <div className="flex-grow overflow-hidden bg-background">
                <ScrollArea className="h-full">
                    {cart.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-center text-muted-foreground p-10">
                            Selecciona productos para empezar
                        </p>
                    </div>
                    ) : (
                    <div className="p-4 space-y-4">
                    {cart.map((item) => (
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
                            <div className="flex items-center gap-2 mt-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(item.id, -1)}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center text-md font-bold">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(item.id, 1)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                            </div>
                        </div>
                        <p className="w-16 text-right font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onRemoveFromCart(item.id)}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                        </div>
                    ))}
                    </div>
                    )}
                </ScrollArea>
            </div>
            <div className="p-4 border-t bg-background space-y-4 flex-shrink-0">
                <div className="flex justify-between text-xl font-bold">
                <p>Total</p>
                <p>${total.toFixed(2)}</p>
                </div>
                <Button
                size="lg"
                className="w-full h-12 text-lg"
                onClick={onCheckout}
                disabled={cart.length === 0}
                >
                <CreditCard className="mr-2 h-5 w-5" />
                Facturar
                </Button>
            </div>
        </div>
    </div>
  );
}


const paymentMethods = [
    { value: 'efectivo', label: 'Efectivo', icon: Banknote },
    { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
    { value: 'transferencia', label: 'Transferencia', icon: Landmark },
    { value: 'credito', label: 'Crédito', icon: Receipt },
] as const;

function CheckoutForm({ form, onSubmit, isSubmitting, onCancel, cart, total, change, isInDialog }: { form: any, onSubmit: (values: any) => void, isSubmitting: boolean, onCancel: () => void, cart: PosCartItem[], total: number, change: number, isInDialog?: boolean }) {
    const paymentMethod = form.watch('paymentMethod');

    const CancelButton = () => {
        const button = (
            <Button type="button" variant="outline" size="lg" className='w-full sm:w-auto' onClick={onCancel} disabled={isSubmitting}>
                Cancelar
            </Button>
        );

        if (isInDialog) {
            return <DialogClose asChild>{button}</DialogClose>
        }
        return button;
    };


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-3 p-4 rounded-lg border bg-muted/50">
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-muted-foreground">Total a Pagar:</span>
                        <span className="font-bold text-2xl">${total.toFixed(2)}</span>
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Cliente {paymentMethod !== 'credito' && '(Opcional)'}</FormLabel>
                            <FormControl>
                                <Input placeholder="Nombre completo" {...field} className="h-11"/>
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
                            <FormLabel>Teléfono {paymentMethod !== 'credito' && '(Opcional)'}</FormLabel>
                            <FormControl>
                                <Input placeholder="Número de teléfono" {...field} className="h-11"/>
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
                                <div className='grid grid-cols-2 gap-3'>
                                   {paymentMethods.map(method => (
                                     <Button
                                         key={method.value}
                                         type="button"
                                         variant={field.value === method.value ? 'secondary' : 'outline'}
                                         className="h-16 text-md flex items-center justify-start gap-3"
                                         onClick={() => field.onChange(method.value)}
                                     >
                                         <method.icon className="h-6 w-6"/>
                                         {method.label}
                                     </Button>
                                   ))}
                                </div>
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
                                    <Input type="number" placeholder="Ej: 50.00" {...field} className="h-11" onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value === '' ? '' : value);
                                    }}/>
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
                                    <Input placeholder="Ej: 123456" {...field} className="h-11" />
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
                                                    'w-full pl-3 text-left font-normal h-11',
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
                    <CancelButton />
                    <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting || cart.length === 0}>
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
  const { categories } = useCategoriesStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [isTicketVisible, setIsTicketVisible] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const productCategories = [...new Set(products.map((p) => p.category))];

  const filteredProducts = React.useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [selectedCategory, products]);

  const total = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const totalItems = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const form = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      paymentMethod: 'efectivo',
      cashAmount: '',
      paymentReference: '',
      paymentDueDate: undefined,
    },
  });
  
  React.useEffect(() => {
    form.setValue('total', total);
  }, [total, form]);

  const { paymentMethod, cashAmount } = form.watch();

  const change = React.useMemo(() => {
    if (paymentMethod === 'efectivo' && cashAmount) {
      const cash = parseFloat(cashAmount);
      if (!isNaN(cash) && cash > total) {
        return cash - total;
      }
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

    toast({
        title: 'Producto añadido',
        description: `${product.name} añadido al pedido.`,
    });

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
    form.reset({ name: '', phone: '', paymentMethod: 'efectivo', paymentDueDate: undefined, cashAmount: '', paymentReference: '' });
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
        customer: { name: values.name || 'Cliente Mostrador', phone: values.phone || 'N/A' },
        items: cart,
        total: total,
        paymentMethod: values.paymentMethod,
        paymentDueDate: values.paymentDueDate ? values.paymentDueDate.toISOString() : undefined,
        cashAmount: values.cashAmount ? parseFloat(values.cashAmount) : undefined,
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
        setIsTicketVisible(false);
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
    <div className="h-screen bg-muted/40">
        <main className="h-full flex flex-col lg:pr-[420px]">
            <header className="p-4 border-b flex flex-wrap items-center gap-4 bg-background z-20">
                <h1 className="text-xl font-bold flex-1 whitespace-nowrap">Punto de Venta</h1>
                 <div className="w-full sm:w-auto sm:flex-initial">
                    <ProductSearch onProductSelect={handleProductSelect} />
                 </div>
            </header>
            <div className="p-4 space-y-4 flex-shrink-0 bg-background">
                 <CategoryList
                    categories={productCategories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                />
                <Separator />
            </div>
             <ScrollArea className="flex-1 px-4 bg-background">
                <ProductGrid products={filteredProducts} onProductSelect={handleProductSelect} />
            </ScrollArea>

            <div className="lg:hidden fixed bottom-4 right-4 z-20">
                <Button
                    size="lg"
                    className="relative h-24 w-24 rounded-2xl shadow-lg flex flex-col items-center justify-center p-2 gap-1 bg-primary-light hover:bg-primary-light/90 text-primary border-4 border-background"
                    onClick={() => setIsTicketVisible(true)}
                >
                    <Receipt className="h-7 w-7" />
                    <span className="text-md font-bold">${total.toFixed(2)}</span>
                    {totalItems > 0 && (
                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center border-4 border-background">
                            {totalItems}
                        </div>
                    )}
                </Button>
            </div>
        </main>
        
        <TicketView
            cart={cart}
            total={total}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onClearCart={clearCartAndForm}
            onCheckout={() => {
                setIsCheckoutOpen(true)
                setIsTicketVisible(false)
            }}
        />
        
        <MobileTicketView
            cart={cart}
            total={total}
            isVisible={isTicketVisible}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onClearCart={clearCartAndForm}
            onCheckout={() => {
                setIsCheckoutOpen(true)
                setIsTicketVisible(false)
            }}
            onClose={() => setIsTicketVisible(false)}
        />

        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Finalizar Pedido</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] p-1">
                    <div className="p-4">
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

    