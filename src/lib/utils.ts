
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currencyCode: string, maximumFractionDigits: number = 2) {
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: maximumFractionDigits,
    currencyDisplay: 'symbol',
  }).format(amount);
}
