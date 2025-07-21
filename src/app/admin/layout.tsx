
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ThemeProvider } from '@/components/theme-provider';
import { AdminSidebar } from '@/components/admin/sidebar';
import { usePosCart } from '@/hooks/use-pos-cart';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { PosCart } from '@/components/pos-cart';

function AdminHeader() {
    const { user } = useAuthStore();
    const { items, clearCart } = usePosCart();
    const [isCartOpen, setIsCartOpen] = React.useState(false);
    
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    const handleCheckoutSuccess = () => {
        clearCart();
        setIsCartOpen(false);
    };

    return (
        <>
            <header className='flex items-center justify-between p-4 border-b bg-background'>
                <div className='flex items-center gap-2'>
                    {/* Placeholder for a potential sidebar trigger if needed in the future */}
                </div>
                <div className='flex items-center gap-4'>
                    <div className='relative'>
                        <Button
                            variant="outline"
                            size="icon"
                            className='rounded-lg'
                            onClick={() => setIsCartOpen(true)}
                        >
                            <ShoppingCart className="h-5 w-5" />
                        </Button>
                        {totalItems > 0 && (
                            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-background">
                                {totalItems}
                            </div>
                        )}
                    </div>
                    <div className='text-right'>
                        <p className='font-semibold'>{user?.email}</p>
                        <p className='text-xs text-muted-foreground'>{user?.role}</p>
                    </div>
                </div>
            </header>
            <PosCart
                isOpen={isCartOpen}
                onOpenChange={setIsCartOpen}
                onCheckoutSuccess={handleCheckoutSuccess}
            />
        </>
    )
}

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
        <div className="grid h-screen w-full pl-[5.3rem]">
            <AdminSidebar />
            <div className="flex flex-col">
                <AdminHeader />
                <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
                    {children}
                </main>
            </div>
        </div>
    </ThemeProvider>
  );
}
