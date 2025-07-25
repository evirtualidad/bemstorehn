
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ThemeProvider } from '@/components/theme-provider';
import { AdminHeader } from '@/components/admin/header';
import { MobileSidebar } from '@/components/admin/mobile-sidebar';
import { useOrdersStore } from '@/hooks/use-orders';
import { useProductsStore } from '@/hooks/use-products';
import { useCategoriesStore } from '@/hooks/use-categories';
import { useCustomersStore } from '@/hooks/use-customers';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { useUsersStore } from '@/hooks/use-users-store';
import { useBannersStore } from '@/hooks/use-banners';
import { useLogoStore } from '@/hooks/use-logo-store';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthLoading, initializeSession } = useAuthStore();
  const router = useRouter();

  // Data fetching hooks
  const { fetchOrders } = useOrdersStore();
  const { fetchProducts } = useProductsStore();
  const { fetchCategories } = useCategoriesStore();
  const { fetchCustomers } = useCustomersStore();
  const { fetchSettings } = useSettingsStore();
  const { fetchUsers } = useUsersStore();
  const { fetchBanners } = useBannersStore();
  const { fetchLogo } = useLogoStore();


  React.useEffect(() => {
    const unsubscribe = initializeSession();
    return () => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    };
  }, [initializeSession]);
  
  // Effect to fetch all necessary data once the user is authenticated.
  React.useEffect(() => {
    if (user) {
        fetchOrders();
        fetchProducts();
        fetchCategories();
        fetchCustomers();
        fetchSettings();
        fetchUsers();
        fetchBanners();
        fetchLogo();
    }
  }, [user, fetchOrders, fetchProducts, fetchCategories, fetchCustomers, fetchSettings, fetchUsers, fetchBanners, fetchLogo]);

  React.useEffect(() => {
    if (!isAuthLoading && !user) {
        router.replace('/login');
    }
  }, [user, isAuthLoading, router]);
  
  if (isAuthLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
          <div className="h-screen w-full flex flex-col">
              <AdminHeader />
              <main className="flex-1 overflow-y-auto p-6 bg-muted/40">
                  {children}
              </main>
          </div>
          <MobileSidebar />
      </ThemeProvider>
  );
}
