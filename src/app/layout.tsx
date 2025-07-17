import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CartSheet } from '@/components/cart-sheet';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'BEM STORE HN - Belleza en su Forma más Pura',
  description: 'BEM STORE HN - Tienda de cosméticos de alta calidad con ingredientes naturales.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="light" style={{ colorScheme: 'light' }}>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <CartSheet />
      </body>
    </html>
  );
}
