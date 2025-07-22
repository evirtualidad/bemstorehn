
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currencyCode: string, maximumFractionDigits: number = 2) {
  const numberFormatter = new Intl.NumberFormat('es-HN', {
    maximumFractionDigits: maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  });
  
  // Custom logic to always display "L"
  if (currencyCode === 'HNL') {
    return `L. ${numberFormatter.format(amount)}`;
  }

  // Fallback to default for other currencies
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
    currencyDisplay: 'symbol',
  }).format(amount);
}
