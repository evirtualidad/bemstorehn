
'use client';

import { Header } from '@/components/header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import * as React from 'react';
import { useProductsStore } from '@/hooks/use-products';
import { useCategoriesStore } from '@/hooks/use-categories';
import { useBannersStore } from '@/hooks/use-banners';
import { HomePageContent } from '@/components/store/home-page-content';

export default function Home() {
  const { products, isLoading: isLoadingProducts } = useProductsStore();
  const { categories, isLoading: isLoadingCategories } = useCategoriesStore();
  const { isLoading: isLoadingBanners } = useBannersStore();

  const isLoading = isLoadingProducts || isLoadingCategories || isLoadingBanners;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <HomePageContent 
        products={products}
        categories={categories}
      />
    </div>
  );
}
