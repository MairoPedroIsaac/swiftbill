import { CURRENCIES } from '@/types/invoice';

/** Currencies that are never written with cents. */
export const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'RWF']);

export function currencySymbol(code?: string | null): string {
  const c = (code || 'USD').toUpperCase();
  return CURRENCIES.find((x) => x.code === c)?.symbol || c;
}

/** 45000000 in RWF -> "FRw 45,000,000"; 1234.5 in USD -> "$1,234.50". */
export function formatMoney(amount: number, code?: string | null): string {
  const c = (code || 'USD').toUpperCase();
  const digits = ZERO_DECIMAL_CURRENCIES.has(c) ? 0 : 2;
  const value = Number.isFinite(amount) && Math.abs(amount) >= 0.005 ? amount : 0;
  const n = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  const sym = currencySymbol(c);
  // One-character symbols sit tight ($1,200); longer ones get a space (FRw 1,200).
  return sym.length === 1 ? `${sym}${n}` : `${sym} ${n}`;
}
