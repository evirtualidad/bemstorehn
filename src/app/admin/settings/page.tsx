
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
import { Percent } from 'lucide-react';

const settingsFormSchema = z.object({
  taxRate: z.coerce.number().min(0, 'La tasa debe ser 0 o mayor.').max(100, 'La tasa no puede exceder 100.'),
});

export default function SettingsPage() {
  const { taxRate, setTaxRate } = useSettingsStore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      taxRate: taxRate * 100, // Display as percentage
    },
  });
  
  React.useEffect(() => {
    form.reset({ taxRate: taxRate * 100 });
  }, [taxRate, form]);

  const onSubmit = (values: z.infer<typeof settingsFormSchema>) => {
    setTaxRate(values.taxRate / 100); // Store as decimal
    toast({
      title: 'Ajustes Guardados',
      description: 'La tasa de impuestos ha sido actualizada.',
    });
  };

  return (
    <main className="grid flex-1 items-start gap-4">
      <h1 className="text-2xl font-bold mb-4">Ajustes Generales</h1>
      <Card>
        <CardHeader>
          <CardTitle>Impuestos</CardTitle>
          <CardDescription>
            Configura la tasa de Impuesto Sobre Ventas (ISV) que se aplicará a los pedidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-sm">
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
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
              <Button type="submit">Guardar Cambios</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
