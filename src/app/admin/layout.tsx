
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AdminSidebar } from '@/components/admin/sidebar';
import { ThemeProvider } from '@/components/theme-provider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthLoading, initializeSession } = useAuthStore();
  const router = useRouter();

  React.useEffect(() => {
    initializeSession();
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
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
        <div className="grid h-screen grid-cols-[auto_1fr] gap-0 bg-background overflow-hidden">
            <AdminSidebar />
            <main className="overflow-y-auto p-4 sm:p-6">
                {children}
            </main>
        </div>
    </ThemeProvider>
  );
}
