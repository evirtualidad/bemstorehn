
'use client';

import * as React from 'react';
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
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const bannerFormSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.any().refine((file) => {
    if (typeof file === 'string' && file.length > 0) return true; // Already uploaded
    if (file instanceof File && file.name !== '') return true; // New file to upload
    return false;
  }, 'Se requiere una imagen.').refine(file => {
      if (file instanceof File && file.name !== '') {
        return ACCEPTED_IMAGE_TYPES.includes(file.type);
      }
      return true; // Pass if it's a string URL or no file
    }, 'Solo se aceptan imágenes .jpg, .jpeg, .png y .webp.'),
  aiHint: z.string().optional(),
});

interface BannerFormProps {
  banner?: Banner | null;
  onSubmit: (values: z.infer<typeof bannerFormSchema>) => void;
  onCancel: () => void;
}

export function BannerForm({ banner, onSubmit, onCancel }: BannerFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(banner?.image || null);

  const form = useForm<z.infer<typeof bannerFormSchema>>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      title: banner?.title || '',
      description: banner?.description || '',
      image: banner?.image || '',
      aiHint: banner?.aiHint || '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const clearImage = () => {
    form.setValue('image', '');
    setPreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen del Banner</FormLabel>
              <FormControl>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  />
                  {preview ? (
                    <div className="relative group w-full aspect-video rounded-md border border-dashed flex items-center justify-center">
                        <Image src={preview} alt="Vista previa" fill className="object-contain rounded-md p-2"/>
                         <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={clearImage}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                  ) : (
                     <div
                        className="w-full aspect-video rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Haz clic para subir una imagen</p>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título del Banner (Opcional)</FormLabel>
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
              <FormLabel>Descripción (Opcional)</FormLabel>
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
