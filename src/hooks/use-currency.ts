
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

const currencies: Currency[] = [
  // Major Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  // Central American Currencies
  { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$' },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q' },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L' },
  { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.' },
];

const initialCurrency = currencies.find(c => c.code === 'HNL') || currencies[0];

type CurrencyState = {
  currencies: Currency[];
  currency: Currency;
  setCurrency: (currency: Currency) => void;
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currencies: currencies,
      currency: initialCurrency,
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: 'currency-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
