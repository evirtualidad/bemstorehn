
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { type Product } from '@/lib/products';
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

export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useProductsStore();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);

  const handleAddProduct = (values: z.infer<typeof productFormSchema>) => {
    const newProduct: Product = {
      id: `prod_${Math.random().toString(36).substr(2, 9)}`,
      ...values,
      image: values.image || `https://placehold.co/400x400.png?text=${values.name.replace(/\s/g, '+')}`,
      price: Number(values.price),
      stock: Number(values.stock),
      featured: values.featured,
    };
    addProduct(newProduct);
    setIsDialogOpen(false);
  };
  
  const handleEditProduct = (values: z.infer<typeof productFormSchema>) => {
    if (!editingProduct) return;
    
    updateProduct({
      ...editingProduct,
      ...values,
      price: Number(values.price),
      stock: Number(values.stock),
      featured: values.featured,
    });

    setEditingProduct(null);
    setIsDialogOpen(false);
  };
  
  const handleDeleteProduct = (productId: string) => {
    deleteProduct(productId);
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

  const onSubmit = editingProduct ? handleEditProduct : handleAddProduct;


  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="draft">Borrador</TabsTrigger>
            <TabsTrigger value="archived" className="hidden sm:flex">
              Archivados
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
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
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Exportar
              </span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1" onClick={openAddDialog}>
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
                    {editingProduct ? 'Modifica los detalles del producto.' : 'Rellena los detalles del nuevo producto.'} Haz clic en guardar cuando termines.
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
        <TabsContent value="all">
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
                    <TableHead className="hidden md:table-cell">Destacado</TableHead>
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
                  {products.map((product) => (
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
                      </TableCell>
                       <TableCell className="hidden md:table-cell">
                        {product.featured ? 'Sí' : 'No'}
                      </TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.stock}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.category}
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Mostrando <strong>1-{products.length}</strong> de <strong>{products.length}</strong> productos
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
