import type { Metadata } from 'next';
import { Belleza, Alegreya } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CartSheet } from '@/components/cart-sheet';
import { ThemeProvider } from '@/components/theme-provider';
import { BottomNav } from '@/components/store/bottom-nav';

const fontHeading = Belleza({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: '400',
});

const fontBody = Alegreya({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
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
      <body className={`${fontHeading.variable} ${fontBody.variable} font-body antialiased`}>
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
