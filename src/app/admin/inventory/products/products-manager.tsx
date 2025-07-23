
'use client';

import * as React from 'react';
import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Product } from '@/lib/types';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProductForm, productFormSchema } from '@/components/product-form';
import { z } from 'zod';
import { useProductsStore } from '@/hooks/use-products';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCategoriesStore } from '@/hooks/use-categories';

export function ProductsManager() {
  const { products, addProduct, updateProduct, deleteProduct, isLoading, fetchProducts } = useProductsStore();
  const { categories, getCategoryById } = useCategoriesStore();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const { currency } = useCurrencyStore();
  const { toast } = useToast();

  React.useEffect(() => {
      fetchProducts();
  }, [fetchProducts]);
  
  const handleAddProduct = async (values: z.infer<typeof productFormSchema>) => {
    let imageFile: File | undefined;

    if (values.image && typeof values.image === 'object' && 'name' in values.image) {
        imageFile = values.image;
    }

    const { image, ...restOfValues } = values;

    const newProductData = {
        ...restOfValues,
        price: Number(values.price),
        original_price: values.original_price ? Number(values.original_price) : undefined,
        stock: Number(values.stock),
        featured: values.featured,
        aiHint: values.aiHint,
        category_id: values.category,
        imageFile: imageFile,
    };
    
    await addProduct(newProductData as any);
    setIsDialogOpen(false);
  };
  
  const handleEditProduct = async (values: z.infer<typeof productFormSchema>) => {
    if (!editingProduct) return;
    
    let imageUrl = editingProduct.image;
    let imageFile: File | undefined = undefined;

    if (values.image && typeof values.image === 'object' && 'name' in values.image) {
        imageFile = values.image;
    } else if (typeof values.image === 'string') {
        imageUrl = values.image;
    }

    await updateProduct({
      id: editingProduct.id,
      name: values.name,
      description: values.description,
      price: Number(values.price),
      original_price: values.original_price ? Number(values.original_price) : undefined,
      stock: Number(values.stock),
      featured: values.featured,
      aiHint: values.aiHint,
      category_id: values.category,
      image: imageUrl,
      imageFile: imageFile,
    } as any);

    setEditingProduct(null);
    setIsDialogOpen(false);
  };
  
  const handleDeleteProduct = async (productId: string) => {
    await deleteProduct(productId);
  };
  
  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };
  
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setEditingProduct(null);
    }
    setIsDialogOpen(open);
  }

  const onSubmit = async (values: z.infer<typeof productFormSchema>) => {
      if (editingProduct) {
          await handleEditProduct(values);
      } else {
          await handleAddProduct(values);
      }
  };

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Productos</CardTitle>
                <CardDescription>
                    Gestiona tus productos y mira su rendimiento de ventas.
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 rounded-full">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filtrar
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Activo
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Borrador</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Archivado</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-8 gap-1 rounded-full">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Exportar
            </span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1 rounded-full" onClick={openAddDialog}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Añadir Producto
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? 'Modifica los detalles del producto.' : 'Rellena los detalles de la nueva producto.'} Haz clic en guardar cuando termines.
                </DialogDescription>
              </DialogHeader>
              <ProductForm
                key={editingProduct?.id || 'new'}
                product={editingProduct}
                onSubmit={onSubmit}
                onCancel={() => handleDialogChange(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          <CardDescription>
            Gestiona tus productos y mira su rendimiento de ventas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Imagen</span>
                </TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead className="hidden md:table-cell">
                  Stock
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Categoría
                </TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const isDiscounted = product.original_price && product.original_price > product.price;
                const categoryLabel = getCategoryById(product.category_id as string)?.label || 'N/A';
                return (
                  <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt={product.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={product.image || 'https://placehold.co/64x64.png'}
                        width="64"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                        {product.stock > 0 ? 'En Stock' : 'Agotado'}
                      </Badge>
                      {isDiscounted && <Badge variant="offer" className="ml-2">Oferta</Badge>}
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className={cn(isDiscounted && "text-offer font-bold")}>
                              {formatCurrency(product.price, currency.code)}
                            </span>
                            {isDiscounted && (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatCurrency(product.original_price!, currency.code)}
                              </span>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {product.stock}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {categoryLabel}
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
                          <DropdownMenuItem onClick={() => openEditDialog(product)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)}>Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Mostrando <strong>1-{products.length}</strong> de <strong>{products.length}</strong> productos
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
