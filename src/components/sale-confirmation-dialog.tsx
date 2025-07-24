
'use client';

import * as React from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Printer } from 'lucide-react';
import type { Order } from '@/lib/types';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency, cn } from '@/lib/utils';
import Image from 'next/image';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { useLogoStore } from '@/hooks/use-logo-store';
import { paymentMethodLabels } from '@/lib/payment-methods';

interface SaleConfirmationDialogProps {
  order: Order;
  onNewSale: () => void;
}

const PrintableReceipt = React.forwardRef<HTMLDivElement, { order: Order }>(({ order }, ref) => {
    const { currency } = useCurrencyStore();
    const { settings } = useSettingsStore();
    const { logoUrl } = useLogoStore();

    if (!settings) return null;

    const taxRate = settings.tax_rate ?? 0.15;
    const subtotal = order.total / (1 + taxRate);
    const tax = order.total - subtotal;

    return (
        <div ref={ref} className="p-6 bg-white text-black font-mono" style={{ width: '302px' }}>
            <div className="text-center items-center flex flex-col space-y-1.5">
                {logoUrl && <Image src={logoUrl} alt="Logo" width={100} height={40} className="object-contain mb-4"/>}
                <h2 className="text-lg font-semibold leading-none tracking-tight">BEM STORE</h2>
                <p className="text-xs text-gray-600">
                    Pedido: {order.display_id}
                </p>
            </div>
            
            <Separator className="my-2 border-dashed border-gray-400" />
            
            <div className="text-xs space-y-1">
                <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span>{order.created_at ? format(parseISO(order.created_at), 'd/MM/yy, hh:mm a') : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span>{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                    <span>Método:</span>
                    <span>{paymentMethodLabels[order.payment_method]}</span>
                </div>
            </div>

            <Separator className="my-2 border-dashed border-gray-400" />
            
            <div className="space-y-2">
                {order.items.map(item => (
                <div key={item.id} className="text-xs">
                    <p className="font-medium truncate">{item.name}</p>
                    <div className='flex justify-between'>
                        <p>
                            {item.quantity} x {formatCurrency(item.price, currency.code)}
                        </p>
                        <p className="font-semibold">{formatCurrency(item.price * item.quantity, currency.code)}</p>
                    </div>
                </div>
                ))}
            </div>
            
            <Separator className="my-2 border-dashed border-gray-400" />
            
            <div className="text-xs space-y-1">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, currency.code)}</span>
                </div>
                <div className="flex justify-between">
                    <span>ISV ({taxRate * 100}%)</span>
                    <span>{formatCurrency(tax, currency.code)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm mt-1">
                    <span>Total</span>
                    <span>{formatCurrency(order.total, currency.code)}</span>
                </div>
            </div>
            <p className="text-center text-xs text-gray-600 mt-4">
                ¡Gracias por su compra!
            </p>
      </div>
    );
});
PrintableReceipt.displayName = 'PrintableReceipt';

export function SaleConfirmationDialog({ order, onNewSale }: SaleConfirmationDialogProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const receiptRef = React.useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
      content: () => receiptRef.current,
  });

  const handleClose = () => {
    setIsOpen(false);
    onNewSale();
  };
  
  return (
    <>
      <div className="hidden">
        <PrintableReceipt order={order} ref={receiptRef} />
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-sm w-full p-0 flex flex-col gap-0 no-print" hideClose>
              <DialogHeader className="p-6 text-center items-center flex flex-col">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <DialogTitle className="text-2xl">¡Venta Exitosa!</DialogTitle>
                <DialogDescription>
                    Pedido: {order.display_id}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="p-4 bg-muted/50 flex-row gap-2">
                  <button onClick={handlePrint} className={cn(buttonVariants({ variant: 'outline' }), "w-full")}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir Recibo
                  </button>
                  <Button className="w-full" onClick={handleClose}>
                      Nueva Venta
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
