
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
import { Percent, DollarSign } from 'lucide-react';

const settingsFormSchema = z.object({
  taxRate: z.coerce.number().min(0, 'La tasa debe ser 0 o mayor.').max(100, 'La tasa no puede exceder 100.'),
  shippingLocalCost: z.coerce.number().min(0, 'El costo de envío no puede ser negativo.'),
  shippingNationalCost: z.coerce.number().min(0, 'El costo de envío no puede ser negativo.'),
});

export default function SettingsPage() {
  const { taxRate, setTaxRate, shippingLocalCost, setShippingLocalCost, shippingNationalCost, setShippingNationalCost } = useSettingsStore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      taxRate: taxRate * 100, // Display as percentage
      shippingLocalCost: shippingLocalCost,
      shippingNationalCost: shippingNationalCost,
    },
  });
  
  React.useEffect(() => {
    form.reset({ 
      taxRate: taxRate * 100,
      shippingLocalCost: shippingLocalCost,
      shippingNationalCost: shippingNationalCost,
    });
  }, [taxRate, shippingLocalCost, shippingNationalCost, form]);

  const onSubmit = (values: z.infer<typeof settingsFormSchema>) => {
    setTaxRate(values.taxRate / 100); // Store as decimal
    setShippingLocalCost(values.shippingLocalCost);
    setShippingNationalCost(values.shippingNationalCost);
    toast({
      title: 'Ajustes Guardados',
      description: 'La configuración de impuestos y envío ha sido actualizada.',
    });
  };

  return (
    <main className="grid flex-1 items-start gap-8">
      <h1 className="text-2xl font-bold">Ajustes Generales</h1>
      
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

          <Button type="submit">Guardar Cambios</Button>
        </form>
      </Form>
    </main>
  );
}
