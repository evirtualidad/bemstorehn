
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  React.useEffect(() => {
    const unsubscribe = initializeSession();
    return () => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    };
  }, [initializeSession]);

  React.useEffect(() => {
    if (!isAuthLoading) {
      if (!user && !isLoginPage) {
        router.replace('/login');
      } else if (user && isLoginPage) {
        router.replace('/admin/dashboard-v2');
      }
    }
  }, [user, isAuthLoading, router, isLoginPage]);

  if ((isAuthLoading || !user) && !isLoginPage) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Si estamos en la página de login, solo mostramos el contenido
  if (isLoginPage) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <Head>
              <link rel="manifest" href="/admin/manifest.json" />
              <meta name="theme-color" content="#793F5C" />
              <meta name="apple-mobile-web-app-capable" content="yes" />
              <meta name="apple-mobile-web-app-status-bar-style" content="default" />
              <meta name="apple-mobile-web-app-title" content="BEM Admin" />
              <link rel="apple-touch-icon" href="/admin/icons/apple-touch-icon.png" />
            </Head>
            {children}
        </ThemeProvider>
    );
  }

  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
          <Head>
            <link rel="manifest" href="/admin/manifest.json" />
            <meta name="theme-color" content="#793F5C" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="BEM Admin" />
            <link rel="apple-touch-icon" href="/admin/icons/apple-touch-icon.png" />
          </Head>
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
