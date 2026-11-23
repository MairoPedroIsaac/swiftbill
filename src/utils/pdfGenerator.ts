import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceState } from '@/types/invoice';
import { imageSize } from '@/utils/logo';

export type TemplateId = 'minimal' | 'modern' | 'classic';
type RGB = [number, number, number];

// ---------------------------------------------------------------------------
// Page and palette
// ---------------------------------------------------------------------------
const PAGE_W = 210;
const PAGE_H = 297;
const M = 18; // side margin
const RIGHT = PAGE_W - M;

const INK: RGB = [15, 23, 42]; // slate-900
const BODY: RGB = [51, 65, 85]; // slate-700
const MUTED: RGB = [100, 116, 139]; // slate-500
const HAIRLINE: RGB = [226, 232, 240]; // slate-200
const SOFT: RGB = [248, 250, 252]; // slate-50
const NAVY: RGB = [11, 23, 48]; // brand navy
const BLUE: RGB = [37, 99, 235]; // brand blue
const CLASSIC_ACCENT: RGB = [30, 41, 59];

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
// The built-in PDF fonts only cover Latin-1, so symbols like ₹ or FRw are written as codes.
const PDF_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', CAD: 'C$', AUD: 'A$', ZAR: 'R ',
};
const ZERO_DECIMALS = new Set(['JPY', 'RWF', 'KES']);

export function formatMoneyPDF(amount: number, currency: string): string {
  const digits = ZERO_DECIMALS.has(currency) && currency !== 'KES' ? 0 : 2;
  const n = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(amount) < 0.005 ? 0 : amount);
  const sym = PDF_SYMBOLS[currency];
  return sym ? `${sym}${n}` : `${currency} ${n}`;
}

function formatDate(value?: string): string {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}

function totals(state: InvoiceState) {
  const subtotal = state.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0);
  const tax = subtotal * ((Number(state.taxRate) || 0) / 100);
  return { subtotal, tax, total: subtotal + tax };
}

// ---------------------------------------------------------------------------
// Small drawing helpers
// ---------------------------------------------------------------------------
const color = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
const fill = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
const stroke = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);

function label(doc: jsPDF, text: string, x: number, y: number, c: RGB = MUTED, font = 'helvetica', align: 'left' | 'right' = 'left') {
  doc.setFont(font, 'bold');
  doc.setFontSize(7.5);
  color(doc, c);
  spaced(doc, text.toUpperCase(), x, y, 0.6, align);
}

/** Writes a block of lines and returns the y below it. */
function lines(doc: jsPDF, parts: string[], x: number, y: number, width: number, opts: { size?: number; c?: RGB; font?: string; lh?: number; align?: 'left' | 'right' | 'center' } = {}) {
  const { size = 9, c = BODY, font = 'helvetica', lh = 4.4, align = 'left' } = opts;
  doc.setFont(font, 'normal');
  doc.setFontSize(size);
  color(doc, c);
  let cy = y;
  for (const p of parts.filter(Boolean)) {
    const wrapped = doc.splitTextToSize(p, width) as string[];
    for (const w of wrapped) {
      doc.text(w, x, cy, { align });
      cy += lh;
    }
  }
  return cy;
}

/** Letter-spaced text that still lines up: jsPDF's own alignment ignores the extra spacing. */
function spaced(doc: jsPDF, text: string, x: number, y: number, space: number, align: 'left' | 'center' | 'right') {
  const w = doc.getTextWidth(text) + space * (text.length - 1);
  const left = align === 'left' ? x : align === 'center' ? x - w / 2 : x - w;
  doc.setCharSpace(space);
  doc.text(text, left, y);
  doc.setCharSpace(0);
}

/** Header cells follow their column's alignment (numbers right, text left). */
const alignHead = (aligns: Record<number, 'left' | 'center' | 'right'>) => (data: any) => {
  if (data.section === 'head' && aligns[data.column.index]) data.cell.styles.halign = aligns[data.column.index];
};

type LogoInfo = { data: string; format: string; w: number; h: number } | null;

async function loadLogo(state: InvoiceState): Promise<LogoInfo> {
  if (!state.logo || !state.logo.startsWith('data:image/')) return null;
  try {
    const { w, h } = await imageSize(state.logo);
    const format = state.logo.startsWith('data:image/jpeg') ? 'JPEG' : state.logo.startsWith('data:image/webp') ? 'WEBP' : 'PNG';
    return { data: state.logo, format, w, h };
  } catch {
    return null;
  }
}

/** Draws the logo inside a box, keeping its proportions. Returns the drawn size. */
function drawLogo(doc: jsPDF, logo: NonNullable<LogoInfo>, x: number, y: number, maxW: number, maxH: number, align: 'left' | 'center' | 'right' = 'left') {
  const scale = Math.min(maxW / logo.w, maxH / logo.h);
  const w = logo.w * scale;
  const h = logo.h * scale;
  const dx = align === 'left' ? x : align === 'center' ? x - w / 2 : x - w;
  doc.addImage(logo.data, logo.format, dx, y, w, h, undefined, 'FAST');
  return { w, h };
}

function fromLines(state: InvoiceState) {
  return [state.senderAddress, state.senderEmail || '', state.senderPhone || ''];
}

function tableBody(state: InvoiceState) {
  return state.items.map((item) => [
    item.description || 'Item',
    String(item.quantity ?? 0),
    formatMoneyPDF(Number(item.rate) || 0, state.currency),
    formatMoneyPDF((Number(item.quantity) || 0) * (Number(item.rate) || 0), state.currency),
  ]);
}

/** Notes and payment terms, side by side when both exist. Starts a new page if needed. */
function notesBlock(doc: jsPDF, state: InvoiceState, y: number, font: string, labelColor: RGB) {
  const blocks = [
    state.notes ? { title: 'Notes', text: state.notes } : null,
    state.terms ? { title: 'Payment terms', text: state.terms } : null,
  ].filter(Boolean) as { title: string; text: string }[];
  if (!blocks.length) return y;

  const colW = blocks.length === 2 ? (RIGHT - M - 10) / 2 : RIGHT - M;
  doc.setFont(font, 'normal');
  doc.setFontSize(9);
  const heights = blocks.map((b) => (doc.splitTextToSize(b.text, colW) as string[]).length * 4.4 + 8);
  if (y + Math.max(...heights) > PAGE_H - 24) {
    doc.addPage();
    y = 24;
  }
  blocks.forEach((b, i) => {
    const x = M + i * (colW + 10);
    label(doc, b.title, x, y, labelColor, font);
    lines(doc, [b.text], x, y + 5.5, colW, { font, c: BODY });
  });
  return y + Math.max(...heights);
}

function footer(doc: jsPDF, state: InvoiceState, font: string, rule: RGB) {
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    stroke(doc, rule);
    doc.setLineWidth(0.2);
    doc.line(M, PAGE_H - 16, RIGHT, PAGE_H - 16);
    doc.setFont(font, 'normal');
    doc.setFontSize(8);
    color(doc, MUTED);
    doc.text(`${state.senderName || 'Your business'}  ·  Invoice ${state.invoiceNumber || ''}`, M, PAGE_H - 11);
    doc.text(`Page ${p} of ${pages}`, RIGHT, PAGE_H - 11, { align: 'right' });
  }
}

/** Keeps the totals block together: moves to a new page if it would be cut. */
function ensureRoom(doc: jsPDF, y: number, needed: number) {
  if (y + needed > PAGE_H - 24) {
    doc.addPage();
    return 24;
  }
  return y;
}

// ---------------------------------------------------------------------------
// MINIMAL: white page, logo leads, one quiet blue accent on the amount due
// ---------------------------------------------------------------------------
function drawMinimal(doc: jsPDF, state: InvoiceState, logo: LogoInfo) {
  const { subtotal, tax, total } = totals(state);
  const cur = state.currency;

  // Header: logo (or business name) on the left, INVOICE on the right
  let headerBottom = 34;
  if (logo) {
    const { h } = drawLogo(doc, logo, M, 16, 55, 20);
    headerBottom = Math.max(headerBottom, 16 + h + 2);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    color(doc, INK);
    doc.text(state.senderName || 'Your business', M, 26);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  color(doc, INK);
  spaced(doc, 'INVOICE', RIGHT, 27, 1.2, 'right');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  color(doc, MUTED);
  doc.text(state.invoiceNumber || 'INV-001', RIGHT, 34, { align: 'right' });

  // Amount due summary
  let y = headerBottom + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  color(doc, INK);
  const due = formatMoneyPDF(total, cur);
  doc.text(due, M, y);
  const amountW = doc.getTextWidth(due);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  color(doc, MUTED);
  doc.text(state.dueDate ? `due ${formatDate(state.dueDate)}` : 'due on receipt', M + amountW + 3, y);

  y += 7;
  stroke(doc, HAIRLINE);
  doc.setLineWidth(0.3);
  doc.line(M, y, RIGHT, y);

  // Three columns: From, Bill to, Details
  y += 9;
  const colW = (RIGHT - M - 16) / 3;
  const c1 = M, c2 = M + colW + 8, c3 = M + 2 * (colW + 8);
  label(doc, 'From', c1, y);
  label(doc, 'Bill to', c2, y);
  label(doc, 'Details', c3, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  color(doc, INK);
  doc.text(doc.splitTextToSize(state.senderName || 'Your business', colW)[0], c1, y + 6);
  doc.text(doc.splitTextToSize(state.clientName || 'Client name', colW)[0], c2, y + 6);
  const y1 = lines(doc, fromLines(state), c1, y + 11, colW);
  const y2 = lines(doc, [state.clientAddress], c2, y + 11, colW);

  const meta: [string, string][] = [
    ['Invoice no.', state.invoiceNumber || 'INV-001'],
    ['Issued', formatDate(state.date)],
    ['Due', state.dueDate ? formatDate(state.dueDate) : 'On receipt'],
  ];
  let my = y + 6;
  meta.forEach(([k, v]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    color(doc, MUTED);
    doc.text(k, c3, my);
    color(doc, INK);
    doc.text(v, RIGHT, my, { align: 'right' });
    my += 5;
  });

  y = Math.max(y1, y2, my) + 8;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: 24 },
    head: [['Description', 'Qty', 'Unit price', 'Amount']],
    body: tableBody(state),
    theme: 'plain',
    didParseCell: alignHead({ 1: 'right', 2: 'right', 3: 'right' }),
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: { top: 4, bottom: 4, left: 2, right: 2 }, textColor: BODY, lineColor: HAIRLINE },
    headStyles: { fontStyle: 'bold', fontSize: 8, textColor: MUTED, lineWidth: { bottom: 0.4 }, lineColor: INK },
    bodyStyles: { lineWidth: { bottom: 0.2 } },
    columnStyles: {
      0: { cellWidth: 'auto', textColor: INK },
      1: { halign: 'right', cellWidth: 18 },
      2: { halign: 'right', cellWidth: 34 },
      3: { halign: 'right', cellWidth: 34, textColor: INK },
    },
  });

  // Totals
  let ty = ensureRoom(doc, (doc as any).lastAutoTable.finalY + 8, 40);
  const lx = RIGHT - 78;
  const row = (k: string, v: string, bold = false, c: RGB = BODY) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 9.5);
    color(doc, bold ? INK : MUTED);
    doc.text(k, lx, ty);
    color(doc, c);
    doc.text(v, RIGHT, ty, { align: 'right' });
    ty += bold ? 8 : 6;
  };
  row('Subtotal', formatMoneyPDF(subtotal, cur));
  if (state.taxRate > 0) row(`Tax (${state.taxRate}%)`, formatMoneyPDF(tax, cur));
  stroke(doc, HAIRLINE);
  doc.setLineWidth(0.3);
  doc.line(lx, ty - 2.5, RIGHT, ty - 2.5);
  ty += 2.5;
  row('Total', formatMoneyPDF(total, cur), true, INK);
  // Amount due: the one accent
  fill(doc, [239, 246, 255]);
  doc.roundedRect(lx - 4, ty - 5.5, RIGHT - lx + 6, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  color(doc, BLUE);
  doc.text(`Amount due (${cur})`, lx, ty + 1);
  doc.text(formatMoneyPDF(total, cur), RIGHT, ty + 1, { align: 'right' });
  ty += 16;

  notesBlock(doc, state, ty, 'helvetica', MUTED);
  footer(doc, state, 'helvetica', HAIRLINE);
}

// ---------------------------------------------------------------------------
// MODERN: navy header band, blue table head, bold blue total card
// ---------------------------------------------------------------------------
function drawModern(doc: jsPDF, state: InvoiceState, logo: LogoInfo) {
  const { subtotal, tax, total } = totals(state);
  const cur = state.currency;

  // Navy band
  const bandH = 52;
  fill(doc, NAVY);
  doc.rect(0, 0, PAGE_W, bandH, 'F');
  fill(doc, BLUE);
  doc.rect(0, bandH, PAGE_W, 1.6, 'F');

  // Logo sits on a white card so dark logos stay visible on the navy
  if (logo) {
    const maxW = 46, maxH = 16;
    const scale = Math.min(maxW / logo.w, maxH / logo.h);
    const w = logo.w * scale, h = logo.h * scale;
    fill(doc, [255, 255, 255]);
    doc.roundedRect(M, 14, w + 8, h + 8, 2.5, 2.5, 'F');
    drawLogo(doc, logo, M + 4, 18, maxW, maxH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(state.senderName || '', M, 14 + h + 8 + 8);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(state.senderName || 'Your business', M, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(doc.splitTextToSize(state.senderAddress || '', 90)[0] || '', M, 35);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(255, 255, 255);
  doc.text('Invoice', RIGHT, 28, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(147, 197, 253);
  doc.text(state.invoiceNumber || 'INV-001', RIGHT, 36, { align: 'right' });

  // Meta strip
  let y = bandH + 12;
  const meta: [string, string][] = [
    ['Issued', formatDate(state.date)],
    ['Due', state.dueDate ? formatDate(state.dueDate) : 'On receipt'],
    ['Amount due', formatMoneyPDF(total, cur)],
  ];
  const mW = (RIGHT - M) / 3;
  meta.forEach(([k, v], i) => {
    const x = M + i * mW;
    label(doc, k, x, y, BLUE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(i === 2 ? 13 : 11);
    color(doc, INK);
    doc.text(v, x, y + 7);
  });

  // From / Bill to cards
  y += 16;
  const cardW = (RIGHT - M - 8) / 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const fromH = fromLines(state).filter(Boolean).reduce((n, p) => n + (doc.splitTextToSize(p, cardW - 12) as string[]).length, 0);
  const toH = (doc.splitTextToSize(state.clientAddress || '', cardW - 12) as string[]).filter(Boolean).length;
  const cardH = 20 + Math.max(fromH, toH, 1) * 4.4;
  [
    { t: 'From', name: state.senderName || 'Your business', body: fromLines(state) },
    { t: 'Bill to', name: state.clientName || 'Client name', body: [state.clientAddress] },
  ].forEach((card, i) => {
    const x = M + i * (cardW + 8);
    fill(doc, SOFT);
    stroke(doc, HAIRLINE);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');
    label(doc, card.t, x + 6, y + 8, MUTED);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    color(doc, INK);
    doc.text(doc.splitTextToSize(card.name, cardW - 12)[0], x + 6, y + 14);
    lines(doc, card.body, x + 6, y + 19.5, cardW - 12);
  });

  y += cardH + 10;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: 24 },
    head: [['Description', 'Qty', 'Unit price', 'Amount']],
    body: tableBody(state),
    theme: 'plain',
    didParseCell: alignHead({ 1: 'right', 2: 'right', 3: 'right' }),
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: { top: 4.2, bottom: 4.2, left: 4, right: 4 }, textColor: BODY, lineColor: HAIRLINE },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { lineWidth: { bottom: 0.2 } },
    alternateRowStyles: { fillColor: SOFT },
    columnStyles: {
      0: { textColor: INK },
      1: { halign: 'right', cellWidth: 18 },
      2: { halign: 'right', cellWidth: 34 },
      3: { halign: 'right', cellWidth: 34, textColor: INK, fontStyle: 'bold' },
    },
  });

  let ty = ensureRoom(doc, (doc as any).lastAutoTable.finalY + 8, 44);
  const boxW = 84;
  const bx = RIGHT - boxW;
  const row = (k: string, v: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    color(doc, MUTED);
    doc.text(k, bx + 4, ty);
    color(doc, INK);
    doc.text(v, RIGHT - 4, ty, { align: 'right' });
    ty += 6;
  };
  row('Subtotal', formatMoneyPDF(subtotal, cur));
  if (state.taxRate > 0) row(`Tax (${state.taxRate}%)`, formatMoneyPDF(tax, cur));
  ty += 1;
  fill(doc, BLUE);
  doc.roundedRect(bx, ty - 2, boxW, 16, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(219, 234, 254);
  spaced(doc, `TOTAL DUE (${cur})`, bx + 5, ty + 4, 0.6, 'left');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(formatMoneyPDF(total, cur), RIGHT - 5, ty + 9.5, { align: 'right' });
  ty += 26;

  notesBlock(doc, state, ty, 'helvetica', BLUE);
  footer(doc, state, 'helvetica', HAIRLINE);
}

// ---------------------------------------------------------------------------
// CLASSIC: centred letterhead, serif type, double rules, boxed table
// ---------------------------------------------------------------------------
function drawClassic(doc: jsPDF, state: InvoiceState, logo: LogoInfo) {
  const { subtotal, tax, total } = totals(state);
  const cur = state.currency;
  const F = 'times';
  const mid = PAGE_W / 2;

  let y = 16;
  if (logo) {
    const { h } = drawLogo(doc, logo, mid, y, 50, 18, 'center');
    y += h + 7;
  } else {
    y += 6;
  }
  doc.setFont(F, 'bold');
  doc.setFontSize(18);
  color(doc, INK);
  doc.text(state.senderName || 'Your business', mid, y, { align: 'center' });
  y += 5.5;
  const contact = [state.senderAddress?.replace(/\s*\n\s*/g, ', '), state.senderEmail, state.senderPhone].filter(Boolean).join('   ·   ');
  if (contact) {
    y = lines(doc, [contact], mid, y, 160, { font: F, size: 9.5, c: MUTED, align: 'center' });
  }

  // Double rule with INVOICE between
  y += 4;
  stroke(doc, CLASSIC_ACCENT);
  doc.setLineWidth(0.6);
  doc.line(M, y, RIGHT, y);
  doc.setLineWidth(0.2);
  doc.line(M, y + 1.2, RIGHT, y + 1.2);
  y += 11;
  doc.setFont(F, 'bold');
  doc.setFontSize(20);
  color(doc, INK);
  spaced(doc, 'INVOICE', mid, y, 3, 'center');
  y += 10;

  // Bill to (left) and details (right)
  const top = y;
  label(doc, 'Bill to', M, y, MUTED, F);
  doc.setFont(F, 'bold');
  doc.setFontSize(11.5);
  color(doc, INK);
  doc.text(state.clientName || 'Client name', M, y + 6);
  const leftEnd = lines(doc, [state.clientAddress], M, y + 11.5, 85, { font: F, size: 10 });

  const meta: [string, string][] = [
    ['Invoice no.', state.invoiceNumber || 'INV-001'],
    ['Date', formatDate(state.date)],
    ['Due date', state.dueDate ? formatDate(state.dueDate) : 'On receipt'],
  ];
  let my = top;
  const kx = RIGHT - 70;
  meta.forEach(([k, v]) => {
    doc.setFont(F, 'normal');
    doc.setFontSize(10);
    color(doc, MUTED);
    doc.text(k, kx, my + 1);
    doc.setFont(F, 'bold');
    color(doc, INK);
    doc.text(v, RIGHT, my + 1, { align: 'right' });
    my += 6;
  });

  y = Math.max(leftEnd, my) + 6;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: 24 },
    head: [['Description', 'Qty', 'Unit price', 'Amount']],
    body: tableBody(state),
    theme: 'grid',
    didParseCell: alignHead({ 1: 'center', 2: 'right', 3: 'right' }),
    styles: { font: F, fontSize: 10.5, cellPadding: { top: 3.6, bottom: 3.6, left: 3.5, right: 3.5 }, textColor: INK, lineColor: [148, 163, 184], lineWidth: 0.2 },
    headStyles: { fillColor: [241, 245, 249], textColor: INK, fontStyle: 'bold', lineWidth: 0.3, lineColor: CLASSIC_ACCENT },
    columnStyles: {
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'right', cellWidth: 34 },
      3: { halign: 'right', cellWidth: 34 },
    },
  });

  let ty = ensureRoom(doc, (doc as any).lastAutoTable.finalY, 40);
  // Totals as a continuation of the table: right-aligned boxed rows
  const rows: [string, string, boolean][] = [['Subtotal', formatMoneyPDF(subtotal, cur), false]];
  if (state.taxRate > 0) rows.push([`Tax (${state.taxRate}%)`, formatMoneyPDF(tax, cur), false]);
  rows.push([`Total due (${cur})`, formatMoneyPDF(total, cur), true]);
  const tw = 68;
  const tx = RIGHT - tw;
  rows.forEach(([k, v, strong]) => {
    const h = strong ? 10 : 8;
    if (strong) fill(doc, [241, 245, 249]);
    stroke(doc, strong ? CLASSIC_ACCENT : [148, 163, 184]);
    doc.setLineWidth(strong ? 0.4 : 0.2);
    doc.rect(tx, ty, tw, h, strong ? 'FD' : 'S');
    doc.setFont(F, strong ? 'bold' : 'normal');
    doc.setFontSize(strong ? 11.5 : 10.5);
    color(doc, strong ? INK : BODY);
    doc.text(k, tx + 3.5, ty + h / 2 + 1.5);
    doc.text(v, RIGHT - 3.5, ty + h / 2 + 1.5, { align: 'right' });
    ty += h;
  });
  ty += 12;

  ty = notesBlock(doc, state, ty, F, MUTED);

  // Signature-style closing line
  ty = ensureRoom(doc, ty + 6, 14);
  doc.setFont(F, 'italic');
  doc.setFontSize(10.5);
  color(doc, BODY);
  doc.text('Thank you for your business.', M, ty);

  footer(doc, state, F, [203, 213, 225]);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function buildInvoicePDF(state: InvoiceState, template: TemplateId): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setProperties({
    title: `Invoice ${state.invoiceNumber || ''}`.trim(),
    subject: `Invoice for ${state.clientName || 'client'}`,
    author: state.senderName || 'SwiftBill',
    creator: 'SwiftBill',
  });
  const logo = await loadLogo(state);
  if (template === 'modern') drawModern(doc, state, logo);
  else if (template === 'classic') drawClassic(doc, state, logo);
  else drawMinimal(doc, state, logo);
  return doc;
}

export const generatePDF = async (state: InvoiceState, template: TemplateId) => {
  const doc = await buildInvoicePDF(state, template);
  const safe = (state.invoiceNumber || 'invoice').replace(/[^\w.-]+/g, '-');
  doc.save(`${safe}.pdf`);
};
