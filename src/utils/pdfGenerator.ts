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

  if (template === 'minimal') {
    doc.setFont('helvetica');
    
    // Header
    doc.setFontSize(24);
    doc.text('INVOICE', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Invoice Number: ${state.invoiceNumber}`, 14, 32);
    doc.text(`Date: ${state.date}`, 14, 38);
    if (state.dueDate) doc.text(`Due Date: ${state.dueDate}`, 14, 44);

    // Business Info (Right aligned)
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(state.senderName || 'Your Business', 200 - doc.getTextWidth(state.senderName || 'Your Business'), 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    const senderLines = doc.splitTextToSize(state.senderAddress || '', 60);
    doc.text(senderLines, 200 - 60, 28, { align: 'right', maxWidth: 60 });

    // Client Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Bill To:', 14, 60);
    doc.setFontSize(10);
    doc.text(state.clientName || 'Client Name', 14, 66);
    doc.setTextColor(100);
    const clientLines = doc.splitTextToSize(state.clientAddress || '', 80);
    doc.text(clientLines, 14, 72);

    // Table
    autoTable(doc, {
      startY: 95,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
      headStyles: { fontStyle: 'bold', textColor: 0 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

  } else if (template === 'modern') {
    doc.setFont('helvetica');
    
    // Blue accent block
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text('INVOICE', 14, 26);
    
    // Sender (Top right, white)
    doc.setFontSize(12);
    doc.text(state.senderName || 'Your Business', 200 - doc.getTextWidth(state.senderName || 'Your Business'), 20);
    doc.setFontSize(10);
    const senderLines = doc.splitTextToSize(state.senderAddress || '', 60);
    doc.text(senderLines, 200 - 60, 26, { align: 'right', maxWidth: 60 });

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text('Billed To:', 14, 55);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(state.clientName || 'Client Name', 14, 62);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    const clientLines = doc.splitTextToSize(state.clientAddress || '', 80);
    doc.text(clientLines, 14, 68);

    doc.setTextColor(0);
    doc.text(`Invoice No: ${state.invoiceNumber}`, 140, 55);
    doc.text(`Date: ${state.date}`, 140, 62);
    if (state.dueDate) doc.text(`Due Date: ${state.dueDate}`, 140, 69);

    // Table
    autoTable(doc, {
      startY: 90,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, lineColor: [226, 232, 240] },
      headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

  } else {
    // Classic
    doc.setFont('times');
    
    doc.setFontSize(24);
    doc.text(state.senderName || 'Your Business', 14, 24);
    
    doc.setFontSize(10);
    const senderLines = doc.splitTextToSize(state.senderAddress || '', 60);
    doc.text(senderLines, 14, 32);

    doc.setFontSize(28);
    doc.setTextColor(100);
    doc.text('INVOICE', 200 - doc.getTextWidth('INVOICE'), 30);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    doc.line(14, 50, 196, 50);

    doc.text('Bill To:', 14, 60);
    doc.setFont('times', 'bold');
    doc.text(state.clientName || 'Client Name', 14, 66);
    doc.setFont('times', 'normal');
    const clientLines = doc.splitTextToSize(state.clientAddress || '', 80);
    doc.text(clientLines, 14, 72);

    doc.text(`Invoice Number: ${state.invoiceNumber}`, 140, 60);
    doc.text(`Date: ${state.date}`, 140, 66);
    if (state.dueDate) doc.text(`Due Date: ${state.dueDate}`, 140, 72);

    // Table
    autoTable(doc, {
      startY: 95,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      styles: { font: 'times', fontSize: 11, cellPadding: 5, lineColor: 0 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold', lineWidth: 0.1 },
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
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Subtotal:', 140, finalY);
  doc.text(`${currencySymbol}${subtotal.toFixed(2)}`, 196, finalY, { align: 'right' });
  
  if (state.taxRate > 0) {
    doc.text(`Tax (${state.taxRate}%):`, 140, finalY + 8);
    doc.text(`${currencySymbol}${tax.toFixed(2)}`, 196, finalY + 8, { align: 'right' });
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const totalY = state.taxRate > 0 ? finalY + 18 : finalY + 10;
  doc.text('Total:', 140, totalY);
  doc.text(`${currencySymbol}${total.toFixed(2)}`, 196, totalY, { align: 'right' });

  // Notes & Terms
  let textY = totalY + 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);

  if (state.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, textY);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(state.notes, 120);
    doc.text(noteLines, 14, textY + 6);
    textY += (noteLines.length * 5) + 10;
  }

  if (state.terms) {
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 14, textY);
    doc.setFont('helvetica', 'normal');
    const termLines = doc.splitTextToSize(state.terms, 120);
    doc.text(termLines, 14, textY + 6);
  }

  doc.save(`${state.invoiceNumber || 'invoice'}.pdf`);
};
