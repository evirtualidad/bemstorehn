'use client';

import * as React from 'react';
import {
  MoreHorizontal,
  PlusCircle,
} from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCategoriesStore, type Category } from '@/hooks/use-categories';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const categoryFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  label: z.string().min(2, 'La etiqueta debe tener al menos 2 caracteres.'),
});

interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (values: z.infer<typeof categoryFormSchema>) => void;
  onCancel: () => void;
}

function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || '',
      label: category?.label || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre (ID interno)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Skincare" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Etiqueta (Visible para usuarios)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Cuidado de la Piel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className='pt-4'>
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Guardar Categoría</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


export function CategoriesManager() {
  const { categories, addCategory, updateCategory, deleteCategory, fetchCategories, isLoading } = useCategoriesStore();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async (values: z.infer<typeof categoryFormSchema>) => {
    await addCategory(values);
    setIsDialogOpen(false);
  };

  const handleEditCategory = async (values: z.infer<typeof categoryFormSchema>) => {
    if (!editingCategory) return;
    
    await updateCategory({
      ...editingCategory,
      ...values,
    });

    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    await deleteCategory(categoryId);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };
  
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setEditingCategory(null);
    }
    setIsDialogOpen(open);
  };

  const onSubmit = editingCategory ? handleEditCategory : handleAddCategory;

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Categorías de Productos</CardTitle>
                <CardDescription>
                    Gestiona las categorías que agrupan tus productos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center h-48">
                    <LoadingSpinner />
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <>
      <div className="flex items-center mb-4">
        <div className="ml-auto flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1" onClick={openAddDialog}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Añadir Categoría
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Añadir Nueva Categoría'}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'Modifica los detalles de la categoría.' : 'Rellena los detalles de la nueva categoría.'} Haz clic en guardar cuando termines.
                </DialogDescription>
              </DialogHeader>
              <CategoryForm
                key={editingCategory?.id || 'new'}
                category={editingCategory}
                onSubmit={onSubmit}
                onCancel={() => handleDialogChange(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Categorías de Productos</CardTitle>
          <CardDescription>
            Gestiona las categorías que agrupan tus productos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre (ID)</TableHead>
                <TableHead>Etiqueta (Visible)</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-mono text-xs">
                    {category.name}
                  </TableCell>
                  <TableCell className="font-medium">
                    {category.label}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Alternar menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditDialog(category)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteCategory(category.id)}>Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Mostrando <strong>1-{categories.length}</strong> de <strong>{categories.length}</strong> categorías
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
