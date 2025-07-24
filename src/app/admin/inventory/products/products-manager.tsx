
'use client';

import * as React from 'react';
import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  AlertTriangle,
  Search,
  X
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

const LOW_STOCK_THRESHOLD = 5;

function InventoryAlerts({ products }: { products: Product[] }) {
  const lowStockProducts = React.useMemo(() => {
    return products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock);
  }, [products]);

  if (lowStockProducts.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Alertas de Inventario</AlertTitle>
      <AlertDescription>
        <p className="mb-2">Los siguientes productos tienen stock bajo:</p>
        <ul className="list-disc pl-5">
            {lowStockProducts.map(p => (
                <li key={p.id}>
                    <span className="font-semibold">{p.name}</span> - Stock actual: <span className="font-bold">{p.stock}</span>
                </li>
            ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}


export function ProductsManager() {
  const { products, addProduct, updateProduct, deleteProduct, isLoading, fetchProducts } = useProductsStore();
  const { categories, getCategoryById, fetchCategories } = useCategoriesStore();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const { currency } = useCurrencyStore();
  const { toast } = useToast();

  // --- Filter and Search States ---
  const [searchQuery, setSearchQuery] = React.useState('');
  const [stockStatusFilter, setStockStatusFilter] = React.useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = React.useState<string[]>([]);

  React.useEffect(() => {
      fetchProducts();
      fetchCategories();
  }, [fetchProducts, fetchCategories]);
  
  const filteredProducts = React.useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Stock Status filter
    if (stockStatusFilter) {
      if (stockStatusFilter === 'in-stock') {
        filtered = filtered.filter(p => p.stock > LOW_STOCK_THRESHOLD);
      } else if (stockStatusFilter === 'low-stock') {
        filtered = filtered.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);
      } else if (stockStatusFilter === 'out-of-stock') {
        filtered = filtered.filter(p => p.stock === 0);
      }
    }
    
    // Category filter
    if (categoryFilter.length > 0) {
        filtered = filtered.filter(p => categoryFilter.includes(p.category_id as string));
    }

    return filtered;
  }, [products, searchQuery, stockStatusFilter, categoryFilter]);


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
  
  const handleExport = () => {
    const dataToExport = filteredProducts.map(p => ({
      ID: p.id,
      Nombre: p.name,
      Precio: p.price,
      'Precio Original': p.original_price || 'N/A',
      Stock: p.stock,
      Categoria: getCategoryById(p.category_id as string)?.label || 'N/A',
      Destacado: p.featured ? 'Sí' : 'No',
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + [
          Object.keys(dataToExport[0]).join(","),
          ...dataToExport.map(item => Object.values(item).map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
        ].join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_productos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <InventoryAlerts products={products} />
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Buscar por nombre de producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 rounded-full h-10"
            />
            {searchQuery && (
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchQuery('')}>
                    <X className="h-4 w-4"/>
                </Button>
            )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-1 rounded-full w-full sm:w-auto">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filtrar
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={stockStatusFilter === 'in-stock'}
                onCheckedChange={(checked) => setStockStatusFilter(checked ? 'in-stock' : null)}
              >
                En Stock
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={stockStatusFilter === 'low-stock'}
                onCheckedChange={(checked) => setStockStatusFilter(checked ? 'low-stock' : null)}
              >
                Poco Stock
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={stockStatusFilter === 'out-of-stock'}
                onCheckedChange={(checked) => setStockStatusFilter(checked ? 'out-of-stock' : null)}
              >
                Agotado
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
               <DropdownMenuLabel>Filtrar por Categoría</DropdownMenuLabel>
               <DropdownMenuSeparator />
               {categories.map(category => (
                 <DropdownMenuCheckboxItem
                    key={category.id}
                    checked={categoryFilter.includes(category.id)}
                    onCheckedChange={(checked) => {
                        setCategoryFilter(prev => 
                            checked ? [...prev, category.id] : prev.filter(id => id !== category.id)
                        )
                    }}
                 >
                    {category.label}
                 </DropdownMenuCheckboxItem>
               ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-10 gap-1 rounded-full w-full sm:w-auto" onClick={handleExport} disabled={filteredProducts.length === 0}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-rap">
              Exportar
            </span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-10 gap-1 rounded-full w-full sm:w-auto" onClick={openAddDialog}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                  Añadir Producto
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="sm:max-w-xl"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
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
              {filteredProducts.map((product) => {
                const isDiscounted = product.original_price && product.original_price > product.price;
                const categoryLabel = getCategoryById(product.category_id as string)?.label || 'N/A';
                
                let stockBadge;
                if (product.stock === 0) {
                    stockBadge = <Badge variant="destructive">Agotado</Badge>;
                } else if (product.stock <= LOW_STOCK_THRESHOLD) {
                    stockBadge = <Badge variant="secondary" className="bg-amber-100 text-amber-800">Poco Stock</Badge>;
                } else {
                    stockBadge = <Badge variant="default" className="bg-green-100 text-green-800">En Stock</Badge>;
                }

                return (
                  <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt={product.name}
                        className="aspect-square rounded-lg object-cover"
                        height="64"
                        src={product.image || 'https://placehold.co/64x64.png'}
                        width="64"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {stockBadge}
                        {isDiscounted && <Badge variant="offer">Oferta</Badge>}
                      </div>
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
            Mostrando <strong>{filteredProducts.length}</strong> de <strong>{products.length}</strong> productos
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
