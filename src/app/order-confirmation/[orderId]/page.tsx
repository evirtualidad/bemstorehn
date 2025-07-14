
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
        <div className="text-center bg-card p-8 rounded-lg shadow-lg max-w-lg w-full">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">¡Gracias por tu pedido!</h1>
          <p className="text-muted-foreground text-lg mb-2">
            Tu pedido ha sido realizado con éxito.
          </p>
          <p className="text-muted-foreground text-lg mb-8">
            Tu ID de pedido es: <span className="font-bold text-foreground">{params.orderId}</span>
          </p>
          <Button asChild size="lg">
            <Link href="/">Continuar Comprando</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
