
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Loader2, X } from 'lucide-react';
import type { Order } from '@/lib/types';
import { generateReceiptPdf } from '@/ai/flows/generate-receipt-pdf-flow';


interface PdfViewerDialogProps {
  pdfUrl: string | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order;
}

function PdfViewerDialog({ pdfUrl, isOpen, onOpenChange, order }: PdfViewerDialogProps) {
  if (!pdfUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Recibo: {order.display_id}</DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </DialogClose>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <embed src={pdfUrl} type="application/pdf" width="100%" height="100%" />
        </div>
      </DialogContent>
    </Dialog>
  );
}


interface SaleConfirmationDialogProps {
  order: Order;
  onNewSale: () => void;
}

export function SaleConfirmationDialog({ order, onNewSale }: SaleConfirmationDialogProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = React.useState(false);
  
  const handleDownload = async () => {
    setIsGeneratingPdf(true);
    try {
        const result = await generateReceiptPdf(order.id);
        if (result.pdfBase64) {
            const url = `data:application/pdf;base64,${result.pdfBase64}`;
            setPdfUrl(url);
            setIsPdfViewerOpen(true);
        } else {
            throw new Error("La generación del PDF no devolvió datos.");
        }
    } catch(error: any) {
        console.error("Error generating PDF:", error);
        alert(`Error al generar el PDF: ${error.message}`);
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onNewSale();
  };
  
  return (
      <>
          <Dialog open={isOpen && !isPdfViewerOpen} onOpenChange={handleClose}>
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

          <PdfViewerDialog 
            order={order}
            pdfUrl={pdfUrl}
            isOpen={isPdfViewerOpen}
            onOpenChange={setIsPdfViewerOpen}
          />
      </>
  );
}
