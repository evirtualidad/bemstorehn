import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CartSheet } from '@/components/cart-sheet';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { useAuthStore } from '@/hooks/use-auth-store';
import * as React from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'BEM STORE HN - Belleza en su Forma más Pura',
  description: 'BEM STORE HN - Tienda de cosméticos de alta calidad con ingredientes naturales.',
};

// Main layout component
function AppLayout({ children }: { children: React.ReactNode }) {
    // This is a simple trick to ensure auth store is initialized on the client
    // when the app loads, but without causing a full re-render of the tree.
    useAuthStore.getState().initializeSession();

    return (
        <>
            {children}
            <Toaster />
            <CartSheet />
        </>
    );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="light" style={{ colorScheme: 'light' }}>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
