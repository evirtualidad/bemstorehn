
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useProductsStore } from '@/hooks/use-products';
import type { Product } from '@/lib/products';
import Image from 'next/image';
import { CalendarIcon, Loader2, Minus, Plus, Tag, Trash2, Users, Receipt, CreditCard, X, BadgePercent, Truck, Store, MapPin, CheckCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn, formatCurrency } from '@/lib/utils';
import { es } from 'date-fns/locale/es';
import { ProductSearch } from '@/components/product-search';
import { useCategoriesStore, type Category as CategoryType } from '@/hooks/use-categories';
import { useCurrencyStore } from '@/hooks/use-currency';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useOrdersStore, type Address, type NewOrderData } from '@/hooks/use-orders';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { hondurasGeodata } from '@/lib/honduras-geodata';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomersStore, type Customer } from '@/hooks/use-customers';
import { CustomerSearch } from '@/components/customer-search';
import { paymentMethods } from '@/lib/payment-methods.tsx';
import { ProductGrid } from '@/components/product-grid';
import { useAuthStore } from '@/hooks/use-auth-store';
import type { Session } from '@supabase/supabase-js';
import { usePosCart, type PosCartItem } from '@/hooks/use-pos-cart';
import { v4 as uuidv4 } from 'uuid';

type SelectedFilter = { type: 'category' | 'offer'; value: string } | null;

const checkoutFormSchema = z
  .object({
    name: z.string().optional(),
    phone: z.string().optional(),
    deliveryMethod: z.enum(['pickup', 'delivery']),
    address: z.custom<Address>().optional(),
    paymentMethod: z.enum(['efectivo', 'tarjeta', 'transferencia', 'credito'], {
      required_error: 'Debes seleccionar una forma de pago.',
    }),
    paymentDueDate: z.date().optional(),
    cashAmount: z.string().optional(),
    totalWithShipping: z.number().optional(),
    paymentReference: z.string().optional(),
  })
  .refine(data => data.deliveryMethod !== 'delivery' || !!data.address, {
    message: 'La dirección de envío es obligatoria.',
    path: ['address'],
  })
  .refine(data => data.deliveryMethod !== 'delivery' || (!!data.name && data.name.trim() !== ''), {
    message: 'El nombre del cliente es obligatorio para envíos a domicilio.',
    path: ['name'],
  })
  .refine(data => data.deliveryMethod !== 'delivery' || (!!data.phone && data.phone.trim() !== ''), {
    message: 'El teléfono del cliente es obligatorio para envíos a domicilio.',
    path: ['phone'],
  })
  .refine(data => data.paymentMethod !== 'credito' || !!data.paymentDueDate, {
    message: 'La fecha de pago es obligatoria para pagos a crédito.',
    path: ['paymentDueDate'],
  })
  .refine(data => {
    if (data.paymentMethod === 'efectivo' && data.cashAmount && data.totalWithShipping) {
      return Number(data.cashAmount) >= data.totalWithShipping;
    }
    return true;
  }, {
    message: 'El efectivo recibido debe ser mayor o igual al total.',
    path: ['cashAmount'],
  })
  .refine(data => data.paymentMethod !== 'credito' || (!!data.name && data.name.trim() !== ''), {
    message: 'El nombre del cliente es obligatorio para pagos a crédito.',
    path: ['name'],
  })
  .refine(data => data.paymentMethod !== 'credito' || (!!data.phone && data.phone.trim() !== ''), {
    message: 'El teléfono del cliente es obligatorio para pagos a crédito.',
    path: ['phone'],
  });


function CategoryList({
  categories,
  onSelectFilter,
  selectedFilter,
  hasOfferProducts,
}: {
  categories: CategoryType[];
  onSelectFilter: (filter: SelectedFilter) => void;
  selectedFilter: SelectedFilter;
  hasOfferProducts: boolean;
}) {
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
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={isSelected('category', category.name) ? 'default' : 'outline'}
          className="justify-start h-11 px-4"
          onClick={() => onSelectFilter({ type: 'category', value: category.name })}
        >
          {category.label}
        </Button>
      ))}
    </div>
  );
}


function TicketView({
  cart,
  subtotal,
  taxAmount,
  total,
  shippingCost,
  totalWithShipping,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onCheckout,
}: {
  cart: PosCartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  shippingCost: number;
  totalWithShipping: number;
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
                 <div className="flex justify-between">
                    <p className="text-muted-foreground">Envío</p>
                    <p>{shippingCost > 0 ? formatCurrency(shippingCost, currency.code) : 'N/A'}</p>
                </div>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
                <p>Total</p>
                <p>{formatCurrency(totalWithShipping, currency.code)}</p>
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
  shippingCost,
  totalWithShipping,
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
  shippingCost: number;
  totalWithShipping: number;
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
                    <div className="flex justify-between">
                        <p className="text-muted-foreground">Envío</p>
                        <p>{shippingCost > 0 ? formatCurrency(shippingCost, currency.code) : 'N/A'}</p>
                    </div>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                    <p>Total</p>
                    <p>{formatCurrency(totalWithShipping, currency.code)}</p>
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

function ShippingDialog({
  isOpen,
  onOpenChange,
  onSave,
  currentAddress,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (address: Address, cost: number, type: 'local' | 'national') => void;
  currentAddress: Address | undefined;
}) {
  const { shippingLocalCost, shippingNationalCost } = useSettingsStore();

  const shippingFormSchema = z
    .object({
      shippingOption: z.enum(['local', 'national'], {
        required_error: 'Debes seleccionar una opción de envío.',
      }),
      department: z.string().optional(),
      municipality: z.string().optional(),
      colony: z.string().min(3, { message: 'La colonia/residencial debe tener al menos 3 caracteres.' }),
      exactAddress: z.string().min(10, { message: 'La dirección debe tener al menos 10 caracteres.' }),
    })
    .refine(
      (data) => {
        if (data.shippingOption === 'national') {
          return !!data.department && !!data.municipality;
        }
        return true;
      },
      {
        message: 'Departamento y municipio son obligatorios para envíos nacionales.',
        path: ['department'],
      }
    );

  const form = useForm<z.infer<typeof shippingFormSchema>>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      shippingOption: 'local',
      department: undefined,
      municipality: undefined,
      colony: '',
      exactAddress: '',
    },
  });
  
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        shippingOption: (currentAddress as any)?.type || 'local',
        department: currentAddress?.department,
        municipality: currentAddress?.municipality,
        colony: currentAddress?.colony || '',
        exactAddress: currentAddress?.exactAddress || '',
      });
    }
  }, [isOpen, currentAddress, form]);


  const selectedDepartment = form.watch('department');
  const selectedShippingOption = form.watch('shippingOption');

  const handleSave = (values: z.infer<typeof shippingFormSchema>) => {
    const cost = values.shippingOption === 'local' ? shippingLocalCost : shippingNationalCost;
    const finalDepartment = values.shippingOption === 'local' ? 'Francisco Morazán' : values.department!;
    const finalMunicipality = values.shippingOption === 'local' ? 'Distrito Central' : values.municipality!;

    onSave(
      {
        department: finalDepartment,
        municipality: finalMunicipality,
        colony: values.colony,
        exactAddress: values.exactAddress,
      },
      cost,
      values.shippingOption
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Información de Envío</DialogTitle>
          <DialogDescription>Completa los detalles para la entrega a domicilio.</DialogDescription>
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
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('municipality', undefined);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un departamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hondurasGeodata.map((depto) => (
                            <SelectItem key={depto.id} value={depto.nombre}>
                              {depto.nombre}
                            </SelectItem>
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
                          {selectedDepartment &&
                            hondurasGeodata
                              .find((d) => d.nombre === selectedDepartment)
                              ?.municipios.map((muni) => (
                                <SelectItem key={muni.id} value={muni.nombre}>
                                  {muni.nombre}
                                </SelectItem>
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
                    <Input placeholder="Ej: Colonia Kennedy" {...field} />
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
                    <Textarea placeholder="Bloque, número de casa, referencias, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit" form="shipping-form">
            Guardar Dirección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckoutForm({ form, onSubmit, isSubmitting, onCancel, cart, total, subtotal, taxAmount, shippingCost, totalWithShipping, change, isInDialog, onOpenShipping, onCustomerSelect }: { form: any, onSubmit: (values: any) => void, isSubmitting: boolean, onCancel: () => void, cart: PosCartItem[], total: number, subtotal: number, taxAmount: number, shippingCost: number, totalWithShipping: number, change: number, isInDialog?: boolean, onOpenShipping: () => void, onCustomerSelect: (customer: Customer | null) => void }) {
    const paymentMethod = form.watch('paymentMethod');
    const deliveryMethod = form.watch('deliveryMethod');
    const address = form.watch('address');
    const { currency } = useCurrencyStore();
    const { taxRate, pickupAddress } = useSettingsStore();

    const [today, setToday] = React.useState<Date | null>(null);

    React.useEffect(() => {
        setToday(new Date());
    }, []);

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
                    <div className="flex justify-between items-center text-md">
                        <span className="text-muted-foreground">Envío:</span>
                        <span className="font-medium">{shippingCost > 0 ? formatCurrency(shippingCost, currency.code) : (deliveryMethod === 'pickup' ? 'GRATIS' : 'N/A')}</span>
                    </div>
                     <Separator />
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-muted-foreground">Total a Pagar:</span>
                        <span className="font-bold text-2xl">{formatCurrency(totalWithShipping, currency.code)}</span>
                    </div>
                </div>

                <div className='space-y-6'>
                    <CustomerSearch onCustomerSelect={onCustomerSelect} form={form}/>
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                    <Input placeholder="Número de teléfono" {...field} className="h-11"/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Controller
                    control={form.control}
                    name="deliveryMethod"
                    render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-4">
                            <label className={cn("flex flex-col gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent/50", field.value === 'pickup' && "bg-accent border-primary")}>
                                <div className="flex items-center gap-4">
                                    <RadioGroupItem value="pickup" id="pickup"/>
                                    <div className="flex-1 flex items-center gap-2">
                                        <Store className="h-5 w-5"/>
                                        <p className="font-semibold">Recoger en Tienda</p>
                                    </div>
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
                                                <Button variant="link" className="p-0 h-auto" type="button" onClick={onOpenShipping}>Editar Dirección</Button>
                                            </div>
                                        ) : (
                                            <Button type="button" onClick={onOpenShipping}>Añadir Dirección de Envío</Button>
                                        )}
                                         <FormMessage>{form.formState.errors.address?.message}</FormMessage>
                                    </div>
                                )}
                            </label>
                        </RadioGroup>
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
                                         <method.icon />
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
                                            disabled={(date) => today ? date < today : true}
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
  const { 
      items: cart,
      setItems: setCart,
      totalWithShipping,
      subtotal,
      taxAmount,
      total,
      shippingCost,
      setShippingCost,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
  } = usePosCart();
  const { products, fetchProducts, isLoading: isLoadingProducts, decreaseStock } = useProductsStore();
  const { addOrderToState, fetchOrders } = useOrdersStore();
  const { customers, fetchCustomers, isLoading: isLoadingCustomers, addOrUpdateCustomer } = useCustomersStore();
  const { categories, fetchCategories, isLoading: isLoadingCategories } = useCategoriesStore();
  const { currency } = useCurrencyStore();
  const { toast } = useToast();
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isTicketVisible, setIsTicketVisible] = React.useState(false);
  const [selectedFilter, setSelectedFilter] = React.useState<SelectedFilter>(null);
  const [isShippingDialogOpen, setIsShippingDialogOpen] = React.useState(false);
  const { session } = useAuthStore();

  React.useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomers();
  }, [fetchProducts, fetchCategories, fetchCustomers]);
  
  const hasOfferProducts = React.useMemo(() => products.some(p => p.originalPrice && p.originalPrice > p.price), [products]);
  
  const filteredProducts = React.useMemo(() => {
    if (!selectedFilter) return products;
    
    if (selectedFilter.type === 'category') {
      return products.filter((p) => p.category === selectedFilter.value);
    }
    if (selectedFilter.type === 'offer') {
      return products.filter(p => p.originalPrice && p.originalPrice > p.price);
    }
    return products;
  }, [selectedFilter, products]);

  const totalItems = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const form = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      deliveryMethod: 'pickup',
      address: undefined,
      paymentMethod: 'efectivo',
      cashAmount: '',
      paymentReference: '',
      paymentDueDate: undefined,
    },
  });
  
  React.useEffect(() => {
    form.setValue('totalWithShipping', totalWithShipping);
  }, [totalWithShipping, form]);

  const { paymentMethod, cashAmount, deliveryMethod } = form.watch();

  const change = React.useMemo(() => {
    if (paymentMethod === 'efectivo' && cashAmount) {
      const cash = parseFloat(cashAmount);
      if (!isNaN(cash) && cash > totalWithShipping) {
        return cash - totalWithShipping;
      }
    }
    return 0;
  }, [paymentMethod, cashAmount, totalWithShipping]);

  React.useEffect(() => {
    if (deliveryMethod === 'pickup') {
      setShippingCost(0);
      form.setValue('address', undefined);
      form.clearErrors('address');
    } else if (deliveryMethod === 'delivery' && !form.getValues('address')) {
      setShippingCost(0);
    }
  }, [deliveryMethod, form, setShippingCost]);

  const handleSaveShippingInfo = (address: Address, cost: number, type: 'local' | 'national') => {
    const addressWithType = { ...address, type };
    form.setValue('address', addressWithType as Address);
    setShippingCost(cost);
  };

  const handleProductSelect = (product: Product): boolean => {
    return addToCart(product);
  };
  
  const handleProductClick = (product: Product) => {
    const wasAdded = handleProductSelect(product);
    if (wasAdded) {
      setTimeout(() => {
        toast({
          title: 'Producto añadido',
          description: `${product.name} añadido al pedido.`,
          duration: 3000,
        });
      }, 0);
    }
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    form.setValue('address', undefined);
    setShippingCost(0);
        
    if (customer) {
        form.setValue('name', customer.name);
        form.setValue('phone', customer.phone || '');
        if (customer.address) {
            form.setValue('address', customer.address as Address);
        }
    } else {
       form.setValue('name', form.getValues('name') || '');
       form.setValue('phone', form.getValues('phone') || '');
    }
  };

  const updateQuantity = (productId: string, amount: number) => {
    const itemToUpdate = cart.find(item => item.id === productId);
    if (!itemToUpdate) return;
    
    if (amount > 0) {
        if(itemToUpdate.quantity < itemToUpdate.stock) {
            increaseQuantity(productId)
        } else {
            setTimeout(() => {
                toast({
                    title: 'Stock Máximo Alcanzado',
                    description: `No puedes añadir más ${itemToUpdate.name}.`,
                    variant: 'destructive',
                    duration: 3000,
                });
            }, 0);
        }
    } else {
        decreaseQuantity(productId);
    }
  };

  const clearCartAndForm = () => {
    clearCart();
    form.reset({ name: '', phone: '', deliveryMethod: 'pickup', address: undefined, paymentMethod: 'efectivo', paymentDueDate: undefined, cashAmount: '', paymentReference: '' });
  }

  const handleOpenChangeCheckout = (open: boolean) => {
    setIsCheckoutOpen(open);
    if (!open) {
      clearCartAndForm();
    }
  };

  async function onSubmit(values: z.infer<typeof checkoutFormSchema>) {
    if (cart.length === 0) {
      toast({ title: 'Carrito Vacío', description: 'Añade productos antes de crear un pedido.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    
    console.warn("MODO SIMULADO: La creación de pedidos está simulada y solo afecta el estado local.");

    const customerId = await addOrUpdateCustomer({
        name: values.name || 'Consumidor Final',
        phone: values.phone || 'N/A',
        address: values.address,
        total_to_add: totalWithShipping
    });
    
    for (const item of cart) {
        await decreaseStock(item.id, item.quantity);
    }

    const newOrderData: NewOrderData = {
        user_id: session?.user.id || null,
        customer_id: customerId || null,
        customer_name: values.name || 'Consumidor Final',
        customer_phone: values.phone || 'N/A',
        customer_address: values.address || null,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
        })),
        total: totalWithShipping,
        shipping_cost: shippingCost,
        payment_method: values.paymentMethod,
        payment_due_date: values.paymentDueDate?.toISOString() || null,
        payment_reference: values.paymentReference || null,
        balance: values.paymentMethod === 'credito' ? totalWithShipping : 0,
        payments: values.paymentMethod !== 'credito' ? [{
            amount: totalWithShipping,
            method: values.paymentMethod,
            date: new Date().toISOString(),
            cash_received: values.cashAmount ? Number(values.cashAmount) : undefined,
            change_given: change > 0 ? change : undefined,
        }] : [],
        status: values.paymentMethod === 'credito' ? 'pending-payment' : 'paid',
        source: 'pos',
        delivery_method: values.deliveryMethod,
    };
    
    addOrderToState(newOrderData);

    setTimeout(() => {
        toast({
          title: '¡Pedido Creado (Simulado)!',
          description: 'El pedido se ha añadido localmente.',
        });
        clearCartAndForm();
        setIsCheckoutOpen(false);
        setIsTicketVisible(false);
        setIsSubmitting(false);
        fetchProducts(); // Refresh product list to show updated stock
    }, 500);
  }
  
  const isLoading = isLoadingProducts || isLoadingCategories || isLoadingCustomers;

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-muted/40">
        <header className="p-4 border-b flex flex-wrap items-center gap-4 bg-background z-20">
            <h1 className="text-xl font-bold flex-1 whitespace-nowrap">POS</h1>
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
                <h1 className="text-xl font-bold flex-1 whitespace-nowrap">POS</h1>
                 <div className="w-full sm:w-auto sm:flex-initial">
                    <ProductSearch onProductSelect={handleProductSelect} />
                 </div>
            </header>
            <main className="flex-1 flex flex-col">
                <div className="p-4 space-y-4 flex-shrink-0 bg-background">
                     <CategoryList
                        categories={categories}
                        selectedFilter={selectedFilter}
                        onSelectFilter={setSelectedFilter}
                        hasOfferProducts={hasOfferProducts}
                    />
                    <Separator />
                </div>
                 <ScrollArea className="flex-1 p-4 bg-background">
                     <ProductGrid products={filteredProducts} onProductClick={handleProductClick} />
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
                <span className="text-md font-bold">{formatCurrency(totalWithShipping, currency.code)}</span>
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
            shippingCost={shippingCost}
            totalWithShipping={totalWithShipping}
            onUpdateQuantity={(pid, a) => updateQuantity(pid, a)}
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
            shippingCost={shippingCost}
            totalWithShipping={totalWithShipping}
            isVisible={isTicketVisible}
            onUpdateQuantity={(pid, a) => updateQuantity(pid, a)}
            onRemoveFromCart={removeFromCart}
            onClearCart={clearCartAndForm}
            onCheckout={() => {
                setIsCheckoutOpen(true)
                setIsTicketVisible(false)
            }}
            onClose={() => setIsTicketVisible(false)}
        />

        <Dialog open={isCheckoutOpen} onOpenChange={handleOpenChangeCheckout}>
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
                            onCancel={() => handleOpenChangeCheckout(false)} 
                            cart={cart}
                            subtotal={subtotal}
                            taxAmount={taxAmount}
                            total={total}
                            shippingCost={shippingCost}
                            totalWithShipping={totalWithShipping}
                            change={change} 
                            isInDialog={true}
                            onOpenShipping={() => setIsShippingDialogOpen(true)}
                            onCustomerSelect={handleCustomerSelect}
                        />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
        
        <ShippingDialog
          isOpen={isShippingDialogOpen}
          onOpenChange={setIsShippingDialogOpen}
          onSave={handleSaveShippingInfo}
          currentAddress={form.getValues('address')}
        />
    </div>
  );
}
