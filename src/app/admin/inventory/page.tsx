
'use client'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ProductsManager } from './products/products-manager';
import { CategoriesManager } from './categories/categories-manager';

export default function InventoryPage() {
  return (
    <main className="grid flex-1 items-start gap-4">
      <Tabs defaultValue="products">
        <TabsList className='mb-4'>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
            <ProductsManager />
        </TabsContent>
        <TabsContent value="categories">
            <CategoriesManager />
        </TabsContent>
      </Tabs>
    </main>
  );
}
