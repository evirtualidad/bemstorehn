
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { useToast } from '@/hooks/use-toast';
import { Percent, DollarSign, Store, MoreHorizontal, PlusCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBannersStore, type Banner } from '@/hooks/use-banners';
import { BannerForm, bannerFormSchema } from '@/components/banner-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useRouter } from 'next/navigation';


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

function BannersManager() {
  const { banners, addBanner, updateBanner, deleteBanner, isLoading } = useBannersStore();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingBanner, setEditingBanner] = React.useState<Banner | null>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string | null> => {
    // Simulate upload by creating a blob URL
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
    });
  }

  const handleAddBanner = async (values: z.infer<typeof bannerFormSchema>) => {
    let imageUrl = `https://placehold.co/1200x600.png?text=${values.title.replace(/\s/g, '+')}`;
    
    if (values.image && typeof values.image !== 'string') {
        const uploadedUrl = await uploadImage(values.image);
        if (!uploadedUrl) return;
        imageUrl = uploadedUrl;
    }
    
    const newBannerData: Omit<Banner, 'id'> = {
      title: values.title,
      description: values.description,
      image: imageUrl,
      ...(values.aiHint && { aiHint: values.aiHint }),
    };

    await addBanner(newBannerData);
    setIsDialogOpen(false);
  };

  const handleEditBanner = async (values: z.infer<typeof bannerFormSchema>) => {
    if (!editingBanner) return;
    
    let imageUrl = editingBanner.image;
    if (values.image && typeof values.image !== 'string') {
        const uploadedUrl = await uploadImage(values.image);
        if (!uploadedUrl) return;
        imageUrl = uploadedUrl;
    } else if (typeof values.image === 'string') {
        imageUrl = values.image;
    }

    const updatedBannerData: Banner = {
      ...editingBanner,
      ...values,
      image: imageUrl,
      ...(values.aiHint && { aiHint: values.aiHint }),
    };
    
    if (!values.aiHint) {
        delete (updatedBannerData as Partial<Banner>).aiHint;
    }

    await updateBanner(updatedBannerData);

    setEditingBanner(null);
    setIsDialogOpen(false);
  };

  const handleDeleteBanner = async (bannerId: string) => {
    await deleteBanner(bannerId);
  };

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingBanner(null);
    setIsDialogOpen(true);
  };
  
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setEditingBanner(null);
    }
    setIsDialogOpen(open);
  };

  const onSubmit = editingBanner ? handleEditBanner : handleAddBanner;
  
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Banners del Carrusel</CardTitle>
                <CardDescription>
                    Gestiona los banners que aparecen en el carrusel de la página de inicio.
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
                  Añadir Banner
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>{editingBanner ? 'Editar Banner' : 'Añadir Nuevo Banner'}</DialogTitle>
                <DialogDescription>
                  {editingBanner ? 'Modifica los detalles del banner.' : 'Rellena los detalles del nuevo banner.'} Haz clic en guardar cuando termines.
                </DialogDescription>
              </DialogHeader>
              <BannerForm
                key={editingBanner?.id || 'new'}
                banner={editingBanner}
                onSubmit={onSubmit}
                onCancel={() => handleDialogChange(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Banners del Carrusel</CardTitle>
          <CardDescription>
            Gestiona los banners que aparecen en el carrusel de la página de inicio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[150px] sm:table-cell">
                  Imagen
                </TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={banner.title}
                      className="aspect-video rounded-md object-cover"
                      height="72"
                      src={banner.image || 'https://placehold.co/128x72.png'}
                      width="128"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {banner.title}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {banner.description}
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
                        <DropdownMenuItem onClick={() => openEditDialog(banner)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteBanner(banner.id)}>Eliminar</DropdownMenuItem>
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
            Mostrando <strong>1-{banners.length}</strong> de <strong>{banners.length}</strong> banners
          </div>
        </CardFooter>
      </Card>
    </>
  );
}


export default function SettingsPage() {
  const { role } = useAuthStore();
  const router = useRouter();

  React.useEffect(() => {
    if (role && role !== 'admin') {
      router.replace('/admin/dashboard-v2');
    }
  }, [role, router]);

  if (role !== 'admin') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="grid flex-1 items-start gap-8">
      <Tabs defaultValue="general">
        <div className='flex justify-between items-center mb-4'>
            <h1 className="text-2xl font-bold">Ajustes</h1>
            <TabsList>
            <TabsTrigger value="general">Generales</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="general">
            <GeneralSettings />
        </TabsContent>
        <TabsContent value="banners">
            <BannersManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
