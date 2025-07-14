
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface OrderConfirmationPageProps {
  params: {
    orderId: string;
  };
}

export default function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center bg-muted/30 p-8 rounded-lg shadow-lg max-w-lg w-full">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-headline mb-4">Thank you for your order!</h1>
          <p className="text-muted-foreground text-lg mb-2">
            Your order has been placed successfully.
          </p>
          <p className="text-muted-foreground text-lg mb-8">
            Your order ID is: <span className="font-bold text-foreground">{params.orderId}</span>
          </p>
          <Button asChild size="lg">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
