
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/lib/products';
import { DialogFooter } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { useCategoriesStore } from '@/hooks/use-categories';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const productFormSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  price: z.coerce.number().positive('El precio debe ser un número positivo.'),
  originalPrice: z.coerce.number().positive('El precio debe ser un número positivo.').optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo.'),
  category: z.string({ required_error: 'Debes seleccionar una categoría.' }),
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
  featured: z.boolean().default(false),
}).refine(data => {
    if (data.originalPrice && data.price >= data.originalPrice) {
      return false;
    }
    return true;
}, {
    message: 'El precio de oferta debe ser menor que el precio original.',
    path: ['price'],
});

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (values: z.infer<typeof productFormSchema>) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const { categories, fetchCategories } = useCategoriesStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(product?.image || null);

  React.useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      originalPrice: product?.originalPrice || '',
      stock: product?.stock || 0,
      category: product?.category || '',
      image: product?.image || '',
      featured: product?.featured || false,
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
              <FormLabel>Imagen del Producto</FormLabel>
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
                    <div className="relative group w-full h-48 rounded-md border border-dashed flex items-center justify-center">
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
                        className="w-full h-48 rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors"
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Producto</FormLabel>
              <FormControl>
                <Input placeholder="Glow Serum" {...field} />
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
                  placeholder="Un suero con vitamina C para un tono de piel radiante..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (de Venta)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="45.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="originalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio Original</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="55.00" {...field} />
                </FormControl>
                 <FormDescription>
                  Opcional. Para mostrar oferta.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
         <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="25" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
         <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Producto Destacado
                </FormLabel>
                <FormDescription>
                  Los productos destacados se mostrarán en una sección especial en la página principal.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <DialogFooter className='pt-4'>
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Guardar Producto</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
