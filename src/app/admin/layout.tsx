
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
  const [hasDataBeenFetched, setHasDataBeenFetched] = React.useState(false);

  // Data fetching hooks from Zustand stores
  const dataFetchers = [
      useOrdersStore(state => state.fetchOrders),
      useProductsStore(state => state.fetchProducts),
      useCategoriesStore(state => state.fetchCategories),
      useCustomersStore(state => state.fetchCustomers),
      useSettingsStore(state => state.fetchSettings),
      useUsersStore(state => state.fetchUsers),
      useBannersStore(state => state.fetchBanners),
      useLogoStore(state => state.fetchLogo),
  ];
  
  // Effect to initialize the user's session on mount.
  // This is the first thing that should run.
  React.useEffect(() => {
    const unsubscribe = initializeSession();
    return () => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    };
  }, [initializeSession]);

  // Effect to fetch all necessary application data once the user is authenticated.
  // This runs only when the user object appears and data hasn't been fetched yet.
  React.useEffect(() => {
    if (user && !hasDataBeenFetched) {
        Promise.all(dataFetchers.map(fetcher => fetcher())).then(() => {
            setHasDataBeenFetched(true);
        });
    }
  }, [user, hasDataBeenFetched, dataFetchers]);

  // Effect to handle redirection if the user is not authenticated.
  React.useEffect(() => {
    if (!isAuthLoading && !user) {
        router.replace('/login');
    }
  }, [user, isAuthLoading, router]);

  // Render a loading spinner while the auth state is being determined or initial data is loading.
  if (isAuthLoading || !user || !hasDataBeenFetched) {
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
