
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ThemeProvider } from '@/components/theme-provider';
import { AdminHeader } from '@/components/admin/header';
import { MobileSidebar } from '@/components/admin/mobile-sidebar';
import Head from 'next/head';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthLoading, initializeSession } = useAuthStore();
  const router = useRouter();

  React.useEffect(() => {
    // This now sets up the Supabase auth listener
    const unsubscribe = initializeSession();
    // Cleanup subscription on unmount
    return () => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    };
  }, [initializeSession]);

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
    <>
      <Head>
        <link rel="manifest" href="/admin/manifest.json" />
        <meta name="theme-color" content="#793F5C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BEM Admin" />
      </Head>
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
    </>
  );
}
