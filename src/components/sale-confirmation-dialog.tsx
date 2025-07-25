
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
import { CheckCircle2, Download, Loader2 } from 'lucide-react';
import type { Order } from '@/lib/types';
import { generateReceiptPdf } from '@/ai/flows/generate-receipt-pdf-flow';


interface SaleConfirmationDialogProps {
  order: Order;
  onNewSale: () => void;
}

export function SaleConfirmationDialog({ order, onNewSale }: SaleConfirmationDialogProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  
  const handleDownload = async () => {
    setIsGeneratingPdf(true);
    try {
        const result = await generateReceiptPdf(order.id);
        if (result.pdfBase64) {
            const pdfWindow = window.open("");
            if (pdfWindow) {
                pdfWindow.document.write(
                    "<html><head><title>Recibo " + order.display_id + "</title></head><body style='margin:0; padding:0;'>" +
                    "<iframe width='100%' height='100%' style='border:none;' src='data:application/pdf;base64, " +
                    encodeURI(result.pdfBase64) + "'></iframe></body></html>"
                );
            } else {
                 throw new Error("No se pudo abrir la ventana emergente. Por favor, deshabilita el bloqueador de pop-ups.");
            }
        } else {
            throw new Error("La generación del PDF no devolvió datos.");
        }
    } catch(error: any) {
        console.error("Error generating or opening PDF:", error);
        alert(`Error: ${error.message}`);
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onNewSale();
  };
  
  return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-sm w-full p-0 flex flex-col gap-0" hideClose>
              <DialogHeader className="p-6 text-center items-center flex flex-col">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <DialogTitle className="text-2xl">¡Venta Exitosa!</DialogTitle>
                <DialogDescription>
                    Pedido: {order.display_id}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="p-4 bg-muted/50 flex-row gap-2">
                  <Button variant="outline" className="w-full" onClick={handleDownload} disabled={isGeneratingPdf}>
                      {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      Ver Ticket
                  </Button>
                  <Button className="w-full" onClick={handleClose}>
                      Nueva Venta
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
  );
}
