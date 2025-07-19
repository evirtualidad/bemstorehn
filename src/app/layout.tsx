import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CartSheet } from '@/components/cart-sheet';
import { ThemeProvider } from '@/components/theme-provider';
import { BottomNav } from '@/components/store/bottom-nav';

const fontBody = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'BEM Store HN',
  description: 'Tu tienda de confianza para productos de belleza y cuidado personal.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${fontBody.variable} font-body antialiased`}>
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
