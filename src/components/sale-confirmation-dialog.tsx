
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Printer } from 'lucide-react';
import type { Order } from '@/lib/types';
import { useCurrencyStore } from '@/hooks/use-currency';
import { formatCurrency, cn } from '@/lib/utils';
import Image from 'next/image';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { es } from 'date-fns/locale/es';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { useLogoStore } from '@/hooks/use-logo-store';
import { paymentMethodLabels } from '@/lib/payment-methods';

interface SaleConfirmationDialogProps {
  order: Order;
  onNewSale: () => void;
}

export function SaleConfirmationDialog({ order, onNewSale }: SaleConfirmationDialogProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const { currency } = useCurrencyStore();
  const { settings } = useSettingsStore();
  const { logoUrl } = useLogoStore();

  const handleClose = () => {
    setIsOpen(false);
    onNewSale();
  };

  const handlePrint = () => {
    window.print();
  };
  
  if (!settings) return null;

  const taxRate = settings.tax_rate ?? 0.15;
  const subtotal = order.total / (1 + taxRate);
  const tax = order.total - subtotal;
  
  const ReceiptContent = () => (
     <div className="p-6">
        <DialogHeader className="text-center items-center">
            {logoUrl && <Image src={logoUrl} alt="Logo" width={100} height={40} className="object-contain mb-4"/>}
            <DialogTitle className="text-2xl">¡Venta Exitosa!</DialogTitle>
            <DialogDescription>
                Pedido: {order.display_id}
            </DialogDescription>
        </DialogHeader>
        
        <Separator className="my-4" />
        
        <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha:</span>
                <span className="font-medium">{format(parseISO(order.created_at), 'd/MM/yy, hh:mm a')}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{order.customer_name}</span>
            </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método Pago:</span>
                <span className="font-medium">{paymentMethodLabels[order.payment_method]}</span>
            </div>
        </div>

        <Separator className="my-4" />
        
        <ScrollArea className="max-h-48 -mx-2 px-2">
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center gap-4 text-sm">
                <div className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden border">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} x {formatCurrency(item.price, currency.code)}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(item.price * item.quantity, currency.code)}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <Separator className="my-4" />
        
        <div className="text-sm space-y-2">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal, currency.code)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">ISV ({taxRate * 100}%)</span>
                <span>{formatCurrency(tax, currency.code)}</span>
            </div>
            <div className="flex justify-between font-bold text-base mt-2">
                <span>Total</span>
                <span>{formatCurrency(order.total, currency.code)}</span>
            </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
            ¡Gracias por su compra!
        </p>
      </div>
  );
  
  return (
    <>
      {/* This is the printable ticket, hidden by default */}
      <div className="printable-receipt">
        <ReceiptContent />
      </div>

      {/* This is the on-screen dialog for the cashier */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-sm w-full p-0 flex flex-col gap-0 no-print" hideClose>
              <div className="p-6">
                 <DialogHeader className="text-center items-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                    <DialogTitle className="text-2xl">¡Venta Exitosa!</DialogTitle>
                    <DialogDescription>
                        Pedido: {order.display_id}
                    </DialogDescription>
                </DialogHeader>
              </div>

              <DialogFooter className="p-4 bg-muted/50 flex-row gap-2">
                  <Button variant="outline" className="w-full" onClick={handlePrint}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir Recibo
                  </Button>
                  <Button className="w-full" onClick={handleClose}>
                      Nueva Venta
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
