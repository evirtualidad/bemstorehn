
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns/format';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { CalendarIcon, Loader2, Minus, Plus, Tag, Trash2, Users, Receipt, CreditCard, Banknote, Landmark, X, BadgePercent } from 'lucide-react';
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
import { cn, formatCurrency } from '@/lib/utils';
import { es } from 'date-fns/locale/es';
import { ProductSearch } from '@/components/product-search';
import { useCategoriesStore } from '@/hooks/use-categories';
import { useCurrencyStore } from '@/hooks/use-currency';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useOrdersStore } from '@/hooks/use-orders';
import { useSettingsStore } from '@/hooks/use-settings-store';

type PosCartItem = Product & { quantity: number };

type SelectedFilter = { type: 'category' | 'offer'; value: string } | null;


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
  onSelectFilter,
  selectedFilter,
  hasOfferProducts,
}: {
  categories: string[];
  onSelectFilter: (filter: SelectedFilter) => void;
  selectedFilter: SelectedFilter;
  hasOfferProducts: boolean;
}) {
  const { getCategoryByName } = useCategoriesStore();
  
  const isSelected = (type: 'category' | 'offer' | null, value?: string) => {
    if (!selectedFilter && !type) return true;
    if (!selectedFilter) return false;
    return selectedFilter.type === type && selectedFilter.value === value;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={isSelected(null) ? 'default' : 'outline'}
        className="justify-start h-11 px-4"
        onClick={() => onSelectFilter(null)}
      >
        <Tag className="mr-2 h-4 w-4" />
        Todas
      </Button>
      {hasOfferProducts && (
        <Button
          variant={isSelected('offer', 'all') ? 'default' : 'outline'}
          className="justify-start h-11 px-4 border-offer text-offer hover:bg-offer hover:text-offer-foreground"
          onClick={() => onSelectFilter({ type: 'offer', value: 'all' })}
        >
          <BadgePercent className="mr-2 h-4 w-4" />
          Ofertas
        </Button>
      )}
      {categories.map((categoryName) => {
        const category = getCategoryByName(categoryName);
        if (!category) return null;
        return (
          <Button
            key={category.id}
            variant={isSelected('category', category.name) ? 'default' : 'outline'}
            className="justify-start h-11 px-4"
            onClick={() => onSelectFilter({ type: 'category', value: category.name })}
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
  const { currency } = useCurrencyStore();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
      {products.map((product) => {
        const stockStatus = product.stock <= 0 ? "Agotado" : product.stock < 10 ? "Poco Stock" : "En Stock";
        const isDiscounted = product.originalPrice && product.originalPrice > product.price;

        return (
          <Card
            key={product.id}
            onClick={() => onProductSelect(product)}
            className={cn(
              "cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group flex flex-col",
              isDiscounted && "border-offer"
            )}
          >
            <CardContent className="p-0 flex-grow flex flex-col">
              <div className="relative aspect-square">
                <Image
                  src={product.image || 'https://placehold.co/400x400.png'}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                   {isDiscounted && <Badge variant="offer">Oferta</Badge>}
                  <Badge 
                    className={cn(
                      "w-fit",
                      stockStatus === "Agotado" && "bg-destructive text-destructive-foreground",
                      stockStatus === "Poco Stock" && "bg-amber-500 text-white"
                    )}
                  >
                    {stockStatus}
                  </Badge>
                 </div>
              </div>
              <div className="p-3 flex-grow flex items-center justify-center">
                <h3 className="font-semibold text-sm leading-tight text-center w-full">{product.name}</h3>
              </div>
               <div className={cn(
                    "mt-auto text-center p-2 rounded-b-md text-primary-foreground",
                    isDiscounted ? "bg-offer text-offer-foreground" : "bg-primary"
                )}>
                    <div className="flex items-baseline justify-center gap-2">
                        <span className="text-lg font-bold">{formatCurrency(product.price, currency.code)}</span>
                        {isDiscounted && (
                            <span className="text-sm line-through opacity-80">{formatCurrency(product.originalPrice!, currency.code)}</span>
                        )}
                    </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  );
}

function TicketView({
  cart,
  subtotal,
  taxAmount,
  total,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onCheckout,
}: {
  cart: PosCartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  onUpdateQuantity: (productId: string, amount: number) => void;
  onRemoveFromCart: (productId:string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}) {
  const { currency } = useCurrencyStore();
  const { taxRate } = useSettingsStore();

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
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.price, currency.code)}</p>
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
                    <p className="w-24 text-right font-medium text-sm">{formatCurrency(item.price * item.quantity, currency.code)}</p>
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
            <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <p className="text-muted-foreground">Subtotal</p>
                    <p>{formatCurrency(subtotal, currency.code)}</p>
                </div>
                <div className="flex justify-between">
                    <p className="text-muted-foreground">ISV ({taxRate * 100}%)</p>
                    <p>{formatCurrency(taxAmount, currency.code)}</p>
                </div>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
                <p>Total</p>
                <p>{formatCurrency(total, currency.code)}</p>
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
  subtotal,
  taxAmount,
  isVisible,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onCheckout,
  onClose,
}: {
  cart: PosCartItem[];
  total: number;
  subtotal: number;
  taxAmount: number;
  isVisible: boolean;
  onUpdateQuantity: (productId: string, amount: number) => void;
  onRemoveFromCart: (productId:string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onClose: () => void;
}) {
  if (!isVisible) return null;
  const { currency } = useCurrencyStore();
  const { taxRate } = useSettingsStore();

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
                            <p className="text-xs text-muted-foreground">{formatCurrency(item.price, currency.code)}</p>
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
                        <p className="w-24 text-right font-medium text-sm">{formatCurrency(item.price * item.quantity, currency.code)}</p>
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
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <p className="text-muted-foreground">Subtotal</p>
                        <p>{formatCurrency(subtotal, currency.code)}</p>
                    </div>
                    <div className="flex justify-between">
                        <p className="text-muted-foreground">ISV ({taxRate * 100}%)</p>
                        <p>{formatCurrency(taxAmount, currency.code)}</p>
                    </div>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                    <p>Total</p>
                    <p>{formatCurrency(total, currency.code)}</p>
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

function CheckoutForm({ form, onSubmit, isSubmitting, onCancel, cart, total, subtotal, taxAmount, change, isInDialog }: { form: any, onSubmit: (values: any) => void, isSubmitting: boolean, onCancel: () => void, cart: PosCartItem[], total: number, subtotal: number, taxAmount: number, change: number, isInDialog?: boolean }) {
    const paymentMethod = form.watch('paymentMethod');
    const { currency } = useCurrencyStore();
    const { taxRate } = useSettingsStore();

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
                    <div className="flex justify-between items-center text-md">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(subtotal, currency.code)}</span>
                    </div>
                    <div className="flex justify-between items-center text-md">
                        <span className="text-muted-foreground">ISV ({taxRate * 100}%):</span>
                        <span className="font-medium">{formatCurrency(taxAmount, currency.code)}</span>
                    </div>
                     <Separator />
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-muted-foreground">Total a Pagar:</span>
                        <span className="font-bold text-2xl">{formatCurrency(total, currency.code)}</span>
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
                                    <p className="text-sm text-muted-foreground pt-1">Cambio a devolver: {formatCurrency(change, currency.code)}</p>
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
  const { products, decreaseStock, isHydrated } = useProductsStore();
  const { addOrder } = useOrdersStore();
  const { categories } = useCategoriesStore();
  const { currency } = useCurrencyStore();
  const { taxRate } = useSettingsStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [isTicketVisible, setIsTicketVisible] = React.useState(false);
  const [selectedFilter, setSelectedFilter] = React.useState<SelectedFilter>(null);

  const productCategories = React.useMemo(() => isHydrated ? [...new Set(products.map((p) => p.category))] : [], [products, isHydrated]);
  const hasOfferProducts = React.useMemo(() => isHydrated ? products.some(p => p.originalPrice && p.originalPrice > p.price) : false, [products, isHydrated]);
  
  const filteredProducts = React.useMemo(() => {
    if (!isHydrated) return [];
    if (!selectedFilter) return products;
    
    if (selectedFilter.type === 'category') {
      return products.filter((p) => p.category === selectedFilter.value);
    }
    if (selectedFilter.type === 'offer') {
      return products.filter(p => p.originalPrice && p.originalPrice > p.price);
    }
    return products;
  }, [selectedFilter, products, isHydrated]);

  const { subtotal, taxAmount, total } = React.useMemo(() => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const subtotal = total / (1 + taxRate);
    const taxAmount = total - subtotal;
    return { subtotal, taxAmount, total };
  }, [cart, taxRate]);

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
        const orderInput = {
            customer: { name: values.name, phone: values.phone },
            items: cart,
            total: total,
            paymentMethod: values.paymentMethod,
            paymentDueDate: values.paymentDueDate ? values.paymentDueDate.toISOString() : undefined,
            cashAmount: values.cashAmount ? parseFloat(values.cashAmount) : undefined,
            paymentReference: values.paymentReference,
        };

      const result = await createOrder(orderInput);
      const tempId = result.success ? result.orderId : `ORD-${Date.now().toString().slice(-6)}`;

      if (result.success) {
        cart.forEach((item) => decreaseStock(item.id, item.quantity));
        addOrder({
            id: tempId,
            customer: orderInput.customer,
            items: orderInput.items,
            total: orderInput.total,
            paymentMethod: orderInput.paymentMethod,
            date: new Date().toISOString(),
            paymentDueDate: orderInput.paymentDueDate,
            status: orderInput.paymentMethod === 'credito' ? 'pending-payment' : 'paid',
            source: 'pos',
        });

        toast({
          title: '¡Pedido Creado!',
          description: `Pedido ${tempId} creado con éxito.`,
        });

        clearCartAndForm();
        setIsCheckoutOpen(false);
        setIsTicketVisible(false);
      } else {
        throw new Error('La creación del pedido falló en el flujo.');
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

  if (!isHydrated) {
    return (
      <div className="flex h-screen flex-col bg-muted/40">
        <header className="p-4 border-b flex flex-wrap items-center gap-4 bg-background z-20">
            <h1 className="text-xl font-bold flex-1 whitespace-nowrap">Punto de Venta</h1>
        </header>
        <div className="flex-1">
            <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-muted/40 flex flex-col lg:flex-row">
        <div className='flex flex-col flex-1 lg:pr-[420px]'>
            <header className="p-4 border-b flex flex-wrap items-center gap-4 bg-background z-20 flex-shrink-0">
                <h1 className="text-xl font-bold flex-1 whitespace-nowrap">Punto de Venta</h1>
                 <div className="w-full sm:w-auto sm:flex-initial">
                    <ProductSearch onProductSelect={handleProductSelect} />
                 </div>
            </header>
            <main className="flex-1 flex flex-col">
                <div className="p-4 space-y-4 flex-shrink-0 bg-background">
                     <CategoryList
                        categories={productCategories}
                        selectedFilter={selectedFilter}
                        onSelectFilter={setSelectedFilter}
                        hasOfferProducts={hasOfferProducts}
                    />
                    <Separator />
                </div>
                 <ScrollArea className="flex-1 p-4 bg-background">
                    <ProductGrid products={filteredProducts} onProductSelect={handleProductSelect} />
                </ScrollArea>
            </main>
        </div>

        <div className="lg:hidden fixed bottom-4 right-4 z-20">
            <Button
                size="lg"
                className="relative h-24 w-24 rounded-2xl shadow-lg flex flex-col items-center justify-center p-2 gap-1 bg-primary text-primary-foreground hover:bg-primary/90 border-4 border-background"
                onClick={() => setIsTicketVisible(true)}
            >
                <Receipt className="h-7 w-7" />
                <span className="text-md font-bold">{formatCurrency(total, currency.code)}</span>
                {totalItems > 0 && (
                    <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center border-4 border-background">
                        {totalItems}
                    </div>
                )}
            </Button>
        </div>
        
        <TicketView
            cart={cart}
            subtotal={subtotal}
            taxAmount={taxAmount}
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
            subtotal={subtotal}
            taxAmount={taxAmount}
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
                            subtotal={subtotal}
                            taxAmount={taxAmount}
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
