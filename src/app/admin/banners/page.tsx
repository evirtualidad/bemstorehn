
'use client';

import * as React from 'react';
import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/dialog';
import Image from 'next/image';
import { useBannersStore, type Banner } from '@/hooks/use-banners';
import { BannerForm, bannerFormSchema } from '@/components/banner-form';
import { z } from 'zod';

export default function BannersPage() {
  const { banners, addBanner, updateBanner, deleteBanner } = useBannersStore();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingBanner, setEditingBanner] = React.useState<Banner | null>(null);

  const handleAddBanner = (values: z.infer<typeof bannerFormSchema>) => {
    const newBanner: Banner = {
      id: `banner_${Date.now()}`,
      ...values,
      image: values.image || `https://placehold.co/1200x600.png?text=${values.title.replace(/\s/g, '+')}`,
    };
    addBanner(newBanner);
    setIsDialogOpen(false);
  };

  const handleEditBanner = (values: z.infer<typeof bannerFormSchema>) => {
    if (!editingBanner) return;
    
    updateBanner({
      ...editingBanner,
      ...values,
    });

    setEditingBanner(null);
    setIsDialogOpen(false);
  };

  const handleDeleteBanner = (bannerId: string) => {
    deleteBanner(bannerId);
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

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center">
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
    </main>
  );
}
