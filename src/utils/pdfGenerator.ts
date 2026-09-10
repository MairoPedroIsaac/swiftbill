import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceState, CURRENCIES } from '@/types/invoice';

export const generatePDF = async (state: InvoiceState, template: 'minimal' | 'modern' | 'classic') => {
  const doc = new jsPDF();
  const currencySymbol = CURRENCIES.find(c => c.code === state.currency)?.symbol || '$';

  // Calculations
  const subtotal = state.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const tax = subtotal * (state.taxRate / 100);
  const total = subtotal + tax;

  const tableData = state.items.map(item => [
    item.description || 'Item',
    item.quantity.toString(),
    `${currencySymbol}${item.rate.toFixed(2)}`,
    `${currencySymbol}${(item.quantity * item.rate).toFixed(2)}`
  ]);

  // COLOR PALETTE (Considered, modern palette)
  const CHARCOAL = [26, 26, 26];       // #1a1a1a (Primary text)
  const MUTED_TEXT = [115, 115, 115];   // #737373 (Secondary metadata)
  const DEEP_TEAL = [13, 79, 79];      // #0d4f4f (Modern Accent)
  const MUTED_NAVY = [31, 45, 61];     // #1f2d3d (Minimal Accent)

  if (template === 'minimal') {
    doc.setFont('helvetica');

    // 1. Thin 2.5px top accent line instead of full block
    doc.setLineWidth(0.8);
    doc.setDrawColor(MUTED_NAVY[0], MUTED_NAVY[1], MUTED_NAVY[2]);
    doc.line(14, 15, 196, 15);

    // Header Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text('INVOICE', 14, 28);

    // Business Name & Address (Right aligned)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    const senderName = state.senderName || 'Your Business';
    doc.text(senderName, 196, 28, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    const senderLines = doc.splitTextToSize(state.senderAddress || '', 65);
    doc.text(senderLines, 196, 34, { align: 'right' });

    // Thin section divider
    doc.setLineWidth(0.3);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 48, 196, 48);

    // Bill To & Invoice Metadata
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    doc.text('BILL TO', 14, 56);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text(state.clientName || 'Client Name', 14, 62);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    const clientLines = doc.splitTextToSize(state.clientAddress || '', 75);
    doc.text(clientLines, 14, 68);

    // Invoice Metadata (Right side)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);

    doc.text('Invoice Number:', 130, 56);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(MUTED_NAVY[0], MUTED_NAVY[1], MUTED_NAVY[2]);
    doc.text(state.invoiceNumber || 'INV-001', 196, 56, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    doc.text('Date:', 130, 62);
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text(state.date || '', 196, 62, { align: 'right' });

    if (state.dueDate) {
      doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
      doc.text('Due Date:', 130, 68);
      doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
      doc.text(state.dueDate, 196, 68, { align: 'right' });
    }

    // Table
    autoTable(doc, {
      startY: 85,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 6, textColor: CHARCOAL },
      headStyles: {
        fontStyle: 'bold',
        textColor: CHARCOAL,
        fillColor: [248, 250, 252],
        lineWidth: 0.1,
        lineColor: [226, 232, 240]
      },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

  } else if (template === 'modern') {
    doc.setFont('helvetica');

    // 1. Thin 2.5px top accent line + Small colored tab/label pill (Deep Teal)
    doc.setLineWidth(0.8);
    doc.setDrawColor(DEEP_TEAL[0], DEEP_TEAL[1], DEEP_TEAL[2]);
    doc.line(14, 15, 196, 15);

    // Small accent tag pill
    doc.setFillColor(DEEP_TEAL[0], DEEP_TEAL[1], DEEP_TEAL[2]);
    doc.roundedRect(14, 24, 5, 14, 1, 1, 'F');

    // Header Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text('INVOICE', 23, 35);

    // Sender Info (Right aligned)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    const senderName = state.senderName || 'Your Business';
    doc.text(senderName, 196, 26, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    const senderLines = doc.splitTextToSize(state.senderAddress || '', 65);
    doc.text(senderLines, 196, 32, { align: 'right' });

    // Thin section divider
    doc.setLineWidth(0.3);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 48, 196, 48);

    // Bill To & Invoice Metadata
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DEEP_TEAL[0], DEEP_TEAL[1], DEEP_TEAL[2]);
    doc.text('BILLED TO', 14, 56);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text(state.clientName || 'Client Name', 14, 62);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    const clientLines = doc.splitTextToSize(state.clientAddress || '', 75);
    doc.text(clientLines, 14, 68);

    // Metadata Right Column
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);

    doc.text('Invoice Number:', 130, 56);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DEEP_TEAL[0], DEEP_TEAL[1], DEEP_TEAL[2]);
    doc.text(state.invoiceNumber || 'INV-001', 196, 56, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    doc.text('Date:', 130, 62);
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text(state.date || '', 196, 62, { align: 'right' });

    if (state.dueDate) {
      doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
      doc.text('Due Date:', 130, 68);
      doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
      doc.text(state.dueDate, 196, 68, { align: 'right' });
    }

    // Table
    autoTable(doc, {
      startY: 85,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 6, lineColor: [226, 232, 240] },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: CHARCOAL,
        fontStyle: 'bold',
        lineWidth: 0.2
      },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

  } else {
    // Classic (Traditional)
    doc.setFont('times');

    doc.setFontSize(22);
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text(state.senderName || 'Your Business', 14, 24);

    doc.setFontSize(9.5);
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    const senderLines = doc.splitTextToSize(state.senderAddress || '', 60);
    doc.text(senderLines, 14, 30);

    doc.setFontSize(24);
    doc.setFont('times', 'bold');
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text('INVOICE', 196, 26, { align: 'right' });

    doc.setLineWidth(0.4);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 46, 196, 46);

    doc.setFontSize(9.5);
    doc.setFont('times', 'normal');
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    doc.text('Bill To:', 14, 56);

    doc.setFont('times', 'bold');
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text(state.clientName || 'Client Name', 14, 62);

    doc.setFont('times', 'normal');
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    const clientLines = doc.splitTextToSize(state.clientAddress || '', 80);
    doc.text(clientLines, 14, 68);

    doc.text(`Invoice Number: ${state.invoiceNumber}`, 140, 56);
    doc.text(`Date: ${state.date}`, 140, 62);
    if (state.dueDate) doc.text(`Due Date: ${state.dueDate}`, 140, 68);

    autoTable(doc, {
      startY: 85,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      styles: { font: 'times', fontSize: 10, cellPadding: 5, lineColor: [200, 200, 200] },
      headStyles: { fillColor: [245, 245, 245], textColor: CHARCOAL, fontStyle: 'bold', lineWidth: 0.1 },
      bodyStyles: { lineWidth: 0.1 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });
  }

  // Totals Section (Applies to all)
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);

  doc.text('Subtotal:', 140, finalY);
  doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
  doc.text(`${currencySymbol}${subtotal.toFixed(2)}`, 196, finalY, { align: 'right' });

  let totalY = finalY + 8;
  if (state.taxRate > 0) {
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    doc.text(`Tax (${state.taxRate}%):`, 140, totalY);
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text(`${currencySymbol}${tax.toFixed(2)}`, 196, totalY, { align: 'right' });
    totalY += 8;
  }

  // Divider line before total
  doc.setLineWidth(0.3);
  doc.setDrawColor(226, 232, 240);
  doc.line(140, totalY - 4, 196, totalY - 4);

  // Total Amount - Heavyweight font & Accent color
  const accentColor = template === 'modern' ? DEEP_TEAL : template === 'minimal' ? MUTED_NAVY : CHARCOAL;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
  doc.text('Total:', 140, totalY + 4);

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`${currencySymbol}${total.toFixed(2)}`, 196, totalY + 4, { align: 'right' });

  // Notes & Terms
  let textY = totalY + 16;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  if (state.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text('Notes:', 14, textY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    const noteLines = doc.splitTextToSize(state.notes, 120);
    doc.text(noteLines, 14, textY + 5);
    textY += (noteLines.length * 4.5) + 8;
  }

  if (state.terms) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    doc.text('Terms & Conditions:', 14, textY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    const termLines = doc.splitTextToSize(state.terms, 120);
    doc.text(termLines, 14, textY + 5);
  }

  doc.save(`${state.invoiceNumber || 'invoice'}.pdf`);
};
