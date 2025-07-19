import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CartSheet } from '@/components/cart-sheet';
import { ThemeProvider } from '@/components/theme-provider';
import { BottomNav } from '@/components/store/bottom-nav';

const fontSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Cosmetica Catalog',
  description: 'AI-powered cosmetic recommendations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
          <div className="pb-20 md:pb-0">
            {children}
          </div>
          <Toaster />
          <CartSheet />
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
