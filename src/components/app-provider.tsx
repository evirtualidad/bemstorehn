
'use client';

import * as React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { useAuthStore } from '@/hooks/use-auth-store';

export function AppProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // This ensures auth store is initialized on the client when the app loads.
    useAuthStore.getState().initializeSession();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
