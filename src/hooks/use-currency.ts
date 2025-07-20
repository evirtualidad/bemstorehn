
'use client';

import { create } from 'zustand';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

const honduranLempira: Currency = { code: 'HNL', name: 'Honduran Lempira', symbol: 'L' };

type CurrencyState = {
  currency: Currency;
};

export const useCurrencyStore = create<CurrencyState>()((set) => ({
    currency: honduranLempira,
}));
