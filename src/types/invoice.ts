export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceState {
  senderName: string;
  senderAddress: string;
  clientName: string;
  clientAddress: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  currency: string;
  taxRate: number;
  notes: string;
  terms: string;
  items: LineItem[];
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan' },
  { code: 'ZAR', symbol: 'R', label: 'South African Rand' }
];
