'use client';

import { ThemeProvider } from '@/components/theme-provider';

// This layout is now simplified because the POS page handles its own layout.
// The main purpose is to provide the ThemeProvider.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}
