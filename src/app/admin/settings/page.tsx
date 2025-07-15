
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { useToast } from '@/hooks/use-toast';
import { Percent, DollarSign, Store } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BannersManager } from '../banners/page';

const settingsFormSchema = z.object({
  taxRate: z.coerce.number().min(0, 'La tasa debe ser 0 o mayor.').max(100, 'La tasa no puede exceder 100.'),
  shippingLocalCost: z.coerce.number().min(0, 'El costo de envío no puede ser negativo.'),
  shippingNationalCost: z.coerce.number().min(0, 'El costo de envío no puede ser negativo.'),
  pickupAddress: z.string().min(10, 'La dirección debe tener al menos 10 caracteres.'),
});

function GeneralSettings() {
  const { taxRate, setTaxRate, shippingLocalCost, setShippingLocalCost, shippingNationalCost, setShippingNationalCost, pickupAddress, setPickupAddress } = useSettingsStore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      taxRate: taxRate * 100, // Display as percentage
      shippingLocalCost: shippingLocalCost,
      shippingNationalCost: shippingNationalCost,
      pickupAddress: pickupAddress,
    },
  });
  
  React.useEffect(() => {
    form.reset({ 
      taxRate: taxRate * 100,
      shippingLocalCost: shippingLocalCost,
      shippingNationalCost: shippingNationalCost,
      pickupAddress: pickupAddress,
    });
  }, [taxRate, shippingLocalCost, shippingNationalCost, pickupAddress, form]);

  const onSubmit = (values: z.infer<typeof settingsFormSchema>) => {
    setTaxRate(values.taxRate / 100); // Store as decimal
    setShippingLocalCost(values.shippingLocalCost);
    setShippingNationalCost(values.shippingNationalCost);
    setPickupAddress(values.pickupAddress);
    toast({
      title: 'Ajustes Guardados',
      description: 'La configuración ha sido actualizada.',
    });
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Impuestos</CardTitle>
              <CardDescription>
                Configura la tasa de Impuesto Sobre Ventas (ISV) que se aplicará a los pedidos. El precio final que ingresas para los productos ya debe incluir este impuesto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel>Tasa de ISV (%)</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input type="number" placeholder="15" {...field} className="pl-8" />
                      </FormControl>
                       <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Envíos</CardTitle>
              <CardDescription>
                Define los costos para las diferentes opciones de envío que ofreces a tus clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormField
                control={form.control}
                name="shippingLocalCost"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel>Costo de Envío Local (Tegucigalpa)</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input type="number" placeholder="50.00" {...field} className="pl-8" />
                      </FormControl>
                       <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="shippingNationalCost"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel>Costo de Envío Nacional</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input type="number" placeholder="150.00" {...field} className="pl-8" />
                      </FormControl>
                       <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Dirección de la Tienda</CardTitle>
              <CardDescription>
                Define la dirección física de tu tienda para la opción de "Recoger en Tienda".
              </CardDescription>
            </CardHeader>
            <CardContent>
               <FormField
                control={form.control}
                name="pickupAddress"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel>Dirección para Recogida</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Textarea placeholder="Col. Las Hadas, Blv. Morazán, local #5..." {...field} />
                      </FormControl>
                       <Store className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit">Guardar Cambios</Button>
        </form>
      </Form>
  )
}

export default function SettingsPage() {
  return (
    <main className="grid flex-1 items-start gap-8">
      <h1 className="text-2xl font-bold">Ajustes</h1>
       <Tabs defaultValue="general">
        <TabsList className='mb-4'>
          <TabsTrigger value="general">Generales</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
            <GeneralSettings />
        </TabsContent>
        <TabsContent value="banners">
            <BannersManager />
        </TabsContent>
      </Tabs>
    </main>
  );
}
