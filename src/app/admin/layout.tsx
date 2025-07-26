
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ThemeProvider } from '@/components/theme-provider';
import { AdminHeader } from '@/components/admin/header';
import { MobileSidebar } from '@/components/admin/mobile-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthLoading, initializeSession } = useAuthStore();
  const router = useRouter();

  // Effect to initialize the user's session on mount.
  // This is the central point for auth checking in the admin panel.
  React.useEffect(() => {
    const unsubscribe = initializeSession();
    return () => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    };
  }, [initializeSession]);

  // Effect to handle redirection if the user is not authenticated.
  // This runs whenever the loading state or user state changes.
  React.useEffect(() => {
    if (!isAuthLoading && !user) {
        router.replace('/login');
    }
  }, [user, isAuthLoading, router]);

  // Render a loading spinner while the auth state is being determined.
  // This also prevents rendering children until the user is confirmed.
  if (isAuthLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  // If authentication is successful, render the admin layout.
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
