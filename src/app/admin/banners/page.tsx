
'use client';

// NOTE: This component is not directly used as a page anymore,
// but its logic is now inside `src/app/admin/settings/page.tsx`.
// It is kept here for reference or future use if banners get their own dedicated page again.
// This file is updated to use mock data stores.

import * as React from 'react';
import {
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
import { useBannersStore } from '@/hooks/use-banners';
import type { Banner } from '@/lib/types';
import { BannerForm, bannerFormSchema } from '@/components/banner-form';
import { z } from 'zod';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';


export function BannersManager() {
  const { banners, addBanner, updateBanner, deleteBanner, isLoading, fetchBanners } = useBannersStore();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingBanner, setEditingBanner] = React.useState<Banner | null>(null);
  const { toast } = useToast();
  
  React.useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleAddBanner = async (values: z.infer<typeof bannerFormSchema>) => {
    let imageFile: File | undefined;
    if (values.image && typeof values.image === 'object' && 'name' in values.image) {
        imageFile = values.image;
    }

    await addBanner({
        title: values.title,
        description: values.description,
        aiHint: values.aiHint,
        imageFile,
    });
    
    setIsDialogOpen(false);
  };

  const handleEditBanner = async (values: z.infer<typeof bannerFormSchema>) => {
    if (!editingBanner) return;
    
    let imageFile: File | undefined;
    let imageUrl = editingBanner.image;
    
    if (values.image && typeof values.image === 'object' && 'name' in values.image) {
        imageFile = values.image;
    } else if (typeof values.image === 'string') {
        imageUrl = values.image;
    }

    await updateBanner({
      id: editingBanner.id,
      title: values.title,
      description: values.description,
      image: imageUrl,
      aiHint: values.aiHint,
      imageFile,
    });

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

export default function BannersPage() {
    return (
        <main className="grid flex-1 items-start gap-8">
            <h1 className="text-2xl font-bold">Banners</h1>
            <BannersManager />
        </main>
    );
}
