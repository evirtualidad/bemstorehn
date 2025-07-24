
'use server';
/**
 * @fileOverview A server-side flow to generate a PDF receipt for an order.
 * - generateReceiptPdf: The main function to call from the client.
 */
import { ai } from '@/ai/genkit';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

const GenerateReceiptInputSchema = z.string(); // Order ID
const GenerateReceiptOutputSchema = z.object({
  pdfBase64: z.string(),
});

// Helper function to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
        style: 'currency',
        currency: 'HNL',
        currencyDisplay: 'symbol',
    }).format(amount);
};

// This flow is defined to run on the server and is not directly exposed to the client.
const generateReceiptPdfFlow = ai.defineFlow(
  {
    name: 'generateReceiptPdfFlow',
    inputSchema: GenerateReceiptInputSchema,
    outputSchema: GenerateReceiptOutputSchema,
  },
  async (orderId) => {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    // 1. Fetch Order Data
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
        
    if (orderError) throw new Error(`Error fetching order: ${orderError.message}`);

    // 2. Fetch Settings (for logo and address)
    const { data: settings } = await supabaseAdmin
        .from('settings')
        .select('logo_url, pickup_address')
        .eq('id', 1)
        .single();
        
    // 3. Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([226.77, 566.93]); // 80mm width, 200mm height (adjust as needed)
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let y = height - 20;

    // --- Draw Logo ---
    if (settings?.logo_url) {
        try {
            const logoImageBytes = await fetch(settings.logo_url).then(res => res.arrayBuffer());
            const logoImage = await pdfDoc.embedPng(logoImageBytes);
            const logoDims = logoImage.scale(0.25);
            page.drawImage(logoImage, {
                x: width / 2 - logoDims.width / 2,
                y: y - logoDims.height + 10,
                width: logoDims.width,
                height: logoDims.height,
            });
            y -= logoDims.height + 5;
        } catch(e) {
            console.error("Could not embed logo:", e);
        }
    }

    // --- Draw Header ---
    const drawText = (text: string, x: number, yPos: number, font: PDFFont, size: number) => {
        page.drawText(text, { x, y: yPos, font, size, color: rgb(0, 0, 0) });
    };

    drawText('BEM STORE', width / 2 - fontBold.widthOfTextAtSize('BEM STORE', 12) / 2, y, fontBold, 12);
    y -= 15;
    if (settings?.pickup_address) {
        const addressLines = settings.pickup_address.split(',');
        for(const line of addressLines) {
            drawText(line.trim(), width / 2 - font.widthOfTextAtSize(line.trim(), 7) / 2, y, font, 7);
            y -= 8;
        }
    }
     y -= 5;
    
    // --- Order Info ---
    const drawLine = () => {
        page.drawLine({
            start: { x: 10, y: y },
            end: { x: width - 10, y: y },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7),
            dashArray: [2, 2],
        });
        y -= 10;
    };
    
    drawLine();
    drawText(`Pedido: ${order.display_id}`, 10, y, font, 8); y -= 12;
    drawText(`Fecha: ${format(new Date(order.created_at), 'dd/MM/yy, hh:mm a', {locale: es})}`, 10, y, font, 8); y -= 12;
    drawText(`Cliente: ${order.customer_name}`, 10, y, font, 8); y -= 12;
    drawLine();
    
    // --- Items ---
    for (const item of order.items) {
        drawText(item.name, 10, y, font, 8);
        y -= 10;
        const priceLine = `${item.quantity} x ${formatCurrency(item.price)}`;
        const itemTotal = formatCurrency(item.price * item.quantity);
        drawText(priceLine, 15, y, font, 8);
        drawText(itemTotal, width - 10 - font.widthOfTextAtSize(itemTotal, 8), y, font, 8);
        y -= 12;
    }
    drawLine();

    // --- Totals ---
    const taxRate = settings?.tax_rate ?? 0.15;
    const subtotal = order.total / (1 + taxRate);
    const tax = order.total - subtotal;
    
    const drawTotalLine = (label: string, value: string) => {
        drawText(label, 10, y, font, 8);
        drawText(value, width - 10 - font.widthOfTextAtSize(value, 8), y, font, 8);
        y -= 12;
    }
    
    drawTotalLine('Subtotal', formatCurrency(subtotal));
    drawTotalLine(`ISV (${(taxRate * 100).toFixed(0)}%)`, formatCurrency(tax));
    
    y -= 2;
    drawText('Total', 10, y, fontBold, 10);
    const totalText = formatCurrency(order.total);
    drawText(totalText, width - 10 - fontBold.widthOfTextAtSize(totalText, 10), y, fontBold, 10);
    y -= 20;

    // --- Footer ---
    drawText('¡Gracias por su compra!', width / 2 - font.widthOfTextAtSize('¡Gracias por su compra!', 8) / 2, y, font, 8);

    const pdfBytes = await pdfDoc.save();
    return {
      pdfBase64: Buffer.from(pdfBytes).toString('base64'),
    };
  }
);

// This is the exported function that the client-side code will call.
export async function generateReceiptPdf(orderId: string): Promise<{ pdfBase64: string }> {
  const result = await generateReceiptPdfFlow(orderId);
  return result;
}
