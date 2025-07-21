
'use client'

import * as React from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ProductsManager } from './products/products-manager';
import { CategoriesManager } from './categories/categories-manager';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function InventoryPage() {
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
    <div className="grid flex-1 items-start gap-4">
      <Tabs defaultValue="products">
        <div className='flex justify-between items-center mb-4'>
            <h1 className="text-2xl font-bold">Inventario</h1>
            <TabsList>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="products">
            <ProductsManager />
        </TabsContent>
        <TabsContent value="categories">
            <CategoriesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
