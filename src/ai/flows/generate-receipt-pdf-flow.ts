
'use server';
/**
 * @fileOverview A server-side flow to generate a PDF receipt for an order.
 * - generateReceiptPdf: The main function to call from the client.
 */
import { ai } from '@/ai/genkit';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { format as formatDate, parseISO } from 'date-fns';
import { toZonedTime, format as formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale/es';
import { paymentMethodLabels } from '@/lib/payment-methods';

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

// Helper function to wrap text
const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number) => {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

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
        .select('logo_url, pickup_address, tax_rate')
        .eq('id', 1)
        .single();
        
    // 3. Create PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const pageWidth = 226.77; // 80mm
    const margin = 10;
    
    // --- Calculate dynamic height ---
    let calculatedHeight = 40; // Initial top/bottom margin

    // Logo height
    calculatedHeight += 80;

    // Header text height
    calculatedHeight += 15; // Bem Store HN
    if (settings?.pickup_address) {
        calculatedHeight += wrapText(settings.pickup_address, font, 7, pageWidth - (margin*2)).length * 8;
    }
    calculatedHeight += 20; // Spacing + line
    
    // Order Info height
    calculatedHeight += (4 * 12) + 10;
    
    // Items height
    for (const item of order.items) {
        calculatedHeight += wrapText(item.name, font, 8, pageWidth - (margin*2) - 30).length * 10;
        calculatedHeight += 2;
    }
    calculatedHeight += 15; // Spacing + line

    // Totals height
    calculatedHeight += 5 + (12 * 3) + 10;

    // Payment Info height
    calculatedHeight += 15 + 15; // Title + spacing
    calculatedHeight += 12; // Method
    if (order.payment_reference) calculatedHeight += 12;
    if (order.payment_method === 'credito') {
        calculatedHeight += 12; // Due date
        calculatedHeight += 12; // Balance
    }
    calculatedHeight += 20; // Spacing + line
    
    // Footer height
    calculatedHeight += 10; // "Gracias"

    // --- Create Page with dynamic height ---
    const page = pdfDoc.addPage([pageWidth, calculatedHeight]);
    const { width, height } = page.getSize();
    
    let y = height - 20;

    // --- Draw Logo ---
    if (settings?.logo_url) {
        try {
            const logoImageBytes = await fetch(settings.logo_url).then(res => res.arrayBuffer());
            const logoImage = await pdfDoc.embedPng(logoImageBytes);
            
            const targetWidth = width - (margin * 2);
            const logoDims = logoImage.scaleToFit(targetWidth, 80);

            page.drawImage(logoImage, {
                x: width / 2 - logoDims.width / 2,
                y: y - logoDims.height,
                width: logoDims.width,
                height: logoDims.height,
            });
            y -= (logoDims.height + 15);
        } catch(e) {
            console.error("Could not embed logo:", e);
        }
    }

    // --- Draw Header ---
    const drawText = (text: string, x: number, yPos: number, font: PDFFont, size: number, options: { align?: 'center' | 'left' | 'right' } = {}) => {
        let textWidth = 0;
        if (options.align && options.align !== 'left') {
            textWidth = font.widthOfTextAtSize(text, size);
            if (options.align === 'center') x = width / 2 - textWidth / 2;
            if (options.align === 'right') x = width - margin - textWidth;
        }
        page.drawText(text, { x, y: yPos, font, size, color: rgb(0, 0, 0) });
    };

    drawText('BEM STORE HN', margin, y, fontBold, 12, { align: 'center' });
    y -= 15;
    if (settings?.pickup_address) {
        const addressLines = wrapText(settings.pickup_address, font, 7, width - (margin*2));
        for(const line of addressLines) {
            drawText(line.trim(), margin, y, font, 7, { align: 'center' });
            y -= 8;
        }
    }
     y -= 10;
    
    const drawLine = () => {
        page.drawLine({
            start: { x: margin, y: y },
            end: { x: width - margin, y: y },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7),
            dashArray: [2, 2],
        });
        y -= 10;
    };
    
    // --- Order Info ---
    const timeZone = 'America/Tegucigalpa';
    const zonedDate = toZonedTime(parseISO(order.created_at), timeZone);
    const formattedDate = formatInTimeZone(zonedDate, timeZone, 'dd/MM/yy, hh:mm a', { locale: es });

    drawLine();
    drawText(`Pedido: ${order.display_id}`, margin, y, font, 8); y -= 12;
    drawText(`Fecha: ${formattedDate}`, margin, y, font, 8); y -= 12;
    drawText(`Cliente: ${order.customer_name}`, margin, y, font, 8); y -= 12;
    
    if (order.customer_phone) {
        drawText(`Teléfono: ${order.customer_phone}`, margin, y, font, 8); y -= 12;
    }
    
    drawLine();
    
    // --- Items ---
    for (const item of order.items) {
        const itemLines = wrapText(item.name, font, 8, width - (margin*2) - 30);
        const firstLine = itemLines.shift();
        if (firstLine) {
            drawText(firstLine, margin, y, font, 8);
        }
        
        const priceLine = `${item.quantity}x ${formatCurrency(item.price)}`;
        drawText(priceLine, width - margin, y, font, 8, { align: 'right' });
        y -= 10;

        for (const line of itemLines) {
            drawText(line, margin, y, font, 8);
            y -= 10;
        }

        y -= 2;
    }
    drawLine();

    // --- Totals ---
    y -= 10; // Increased space before subtotal
    const taxRate = settings?.tax_rate ?? 0.15;
    const subtotal = order.total / (1 + taxRate);
    const tax = order.total - subtotal;
    
    const drawTotalLine = (label: string, value: string, isBold: boolean = false) => {
        const currentFont = isBold ? fontBold : font;
        const currentSize = isBold ? 10 : 8;
        drawText(label, margin, y, currentFont, currentSize);
        drawText(value, width - margin, y, currentFont, currentSize, { align: 'right' });
        y -= (currentSize + 4);
    }
    
    drawTotalLine('Subtotal', formatCurrency(subtotal));
    drawTotalLine(`ISV (${(taxRate * 100).toFixed(0)}%)`, formatCurrency(tax));
    y -= 2;
    drawTotalLine('Total', formatCurrency(order.total), true);
    y -= 10;

    // --- Payment Info ---
    drawLine();
    drawText('Información de Pago', margin, y, fontBold, 9);
    y -= 15;
    
    const paymentLabel = paymentMethodLabels[order.payment_method as keyof typeof paymentMethodLabels] || 'No especificado';
    drawText(`Método: ${paymentLabel}`, margin, y, font, 8);
    y -= 12;

    if (order.payment_reference) {
        drawText(`Referencia: ${order.payment_reference}`, margin, y, font, 8);
        y -= 12;
    }

    if (order.payment_method === 'credito' && order.payment_due_date) {
        drawText(`Fecha de Pago: ${formatDate(parseISO(order.payment_due_date), 'dd MMMM, yyyy', {locale: es})}`, margin, y, font, 8);
        y -= 12;
        drawText('Saldo Pendiente:', margin, y, fontBold, 8);
        drawText(formatCurrency(order.balance), width-margin, y, fontBold, 8, {align: 'right'});
        y -= 12;
    }

    drawLine();
    y -= 10;

    // --- Footer ---
    drawText('¡Gracias por su compra!', margin, y, font, 8, { align: 'center' });

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
