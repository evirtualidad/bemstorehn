
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
import { Textarea } from '@/components/ui/textarea';
import type { Banner } from '@/hooks/use-banners';
import { DialogFooter } from './ui/dialog';

export const bannerFormSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  image: z.string().url('Debe ser una URL de imagen válida.').optional().or(z.literal('')),
  aiHint: z.string().optional(),
});

interface BannerFormProps {
  banner?: Banner | null;
  onSubmit: (values: z.infer<typeof bannerFormSchema>) => void;
  onCancel: () => void;
}

export function BannerForm({ banner, onSubmit, onCancel }: BannerFormProps) {
  const form = useForm<z.infer<typeof bannerFormSchema>>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      title: banner?.title || '',
      description: banner?.description || '',
      image: banner?.image || '',
      aiHint: banner?.aiHint || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título del Banner</FormLabel>
              <FormControl>
                <Input placeholder="Novedades de Verano" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descubre nuestra nueva colección de temporada..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de la Imagen</FormLabel>
                <FormControl>
                  <Input placeholder="https://placehold.co/1200x600.png" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="aiHint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pista para IA (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="cosmetics flatlay" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
        />
        <DialogFooter className='pt-4'>
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Guardar Banner</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
