
'use client';

import * as React from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useOrdersStore } from '@/hooks/use-orders';
import { useCurrencyStore } from '@/hooks/use-currency';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { es } from 'date-fns/locale/es';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { useParams } from 'next/navigation';
import type { Order } from '@/lib/types';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const { getOrderById, fetchOrders } = useOrdersStore();
  const { currency } = useCurrencyStore();
  const { taxRate } = useSettingsStore();
  const [order, setOrder] = React.useState<Order | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    // We poll for the order, as it might take a moment to appear in the listener
    const findOrder = () => {
        const foundOrder = getOrderById(orderId);
        if (foundOrder) {
            setOrder(foundOrder);
            setIsLoading(false);
            return true;
        }
        return false;
    }

    if (findOrder()) return;

    // If not found, fetch all orders and try again
    fetchOrders().then(() => {
        if(!findOrder()) {
             // If still not found after fetch, try polling
            const interval = setInterval(() => {
                if (findOrder()) {
                    clearInterval(interval);
                }
            }, 1000);

            // Timeout after 10 seconds if order not found
            const timeout = setTimeout(() => {
                clearInterval(interval);
                 if (!order) {
                    setIsLoading(false);
                }
            }, 10000);

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
    });

  }, [orderId, getOrderById, fetchOrders, order]);


  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center text-center">
                <div>
                    <h1 className="text-4xl font-bold mb-4">Pedido no encontrado</h1>
                    <p className="text-muted-foreground mb-8">No pudimos encontrar los detalles para tu pedido. Por favor, contacta a soporte.</p>
                    <Button asChild><Link href="/">Volver a la tienda</Link></Button>
                </div>
            </main>
        </div>
    );
  }

  const subtotal = order.total / (1 + taxRate);
  const tax = order.total - subtotal;

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="bg-card p-6 md:p-8 rounded-lg shadow-lg max-w-2xl w-full">
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl md:text-4xl font-bold mb-2">¡Gracias por tu pedido!</h1>
            <p className="text-muted-foreground text-md md:text-lg mb-2">
              Tu pedido ha sido realizado con éxito y está siendo procesado.
            </p>
            <p className="text-muted-foreground text-lg mb-8">
              Tu ID de pedido es: <span className="font-bold text-foreground">{order.display_id}</span>
            </p>
          </div>

          <Separator className="my-6" />
          
          <div className="space-y-4">
             <h2 className="text-xl font-semibold mb-4 text-center">Resumen del Pedido</h2>
            {order.items.map(item => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-sm">{item.name}</p>
                   <p className="text-xs text-muted-foreground">
                    {item.quantity} x {formatCurrency(item.price, currency.code)}
                  </p>
                </div>
                 <p className="font-semibold text-sm">
                    {formatCurrency(item.price * item.quantity, currency.code)}
                </p>
              </div>
            ))}
          </div>
          
          <Separator className="my-6" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <p>Subtotal</p>
              <p>{formatCurrency(subtotal, currency.code)}</p>
            </div>
            <div className="flex justify-between">
              <p>ISV ({taxRate * 100}%)</p>
              <p>{formatCurrency(tax, currency.code)}</p>
            </div>
            {order.shipping_cost && order.shipping_cost > 0 ? (
                 <div className="flex justify-between">
                    <p>Envío</p>
                    <p>{formatCurrency(order.shipping_cost, currency.code)}</p>
                </div>
            ): null}
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between text-lg font-bold">
            <p>Total</p>
            <p>{formatCurrency(order.total, currency.code)}</p>
          </div>
          
          <div className="mt-8 text-center">
            <Button asChild size="lg">
              <Link href="/">Continuar Comprando</Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
                Nos pondremos en contacto contigo pronto para coordinar la entrega y el pago.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
