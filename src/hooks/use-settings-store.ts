
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type SettingsState = {
  taxRate: number; // Stored as a decimal, e.g., 0.15 for 15%
  shippingLocalCost: number;
  shippingNationalCost: number;
  pickupAddress: string;
  setTaxRate: (rate: number) => void;
  setShippingLocalCost: (cost: number) => void;
  setShippingNationalCost: (cost: number) => void;
  setPickupAddress: (address: string) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      taxRate: 0.15, // Default to 15%
      shippingLocalCost: 50, // Default HNL 50
      shippingNationalCost: 150, // Default HNL 150
      pickupAddress: 'Col. Las Hadas, Boulevard Morazán, frente a Automall, Tegucigalpa, Honduras',
      setTaxRate: (rate: number) => set({ taxRate: rate }),
      setShippingLocalCost: (cost: number) => set({ shippingLocalCost: cost }),
      setShippingNationalCost: (cost: number) => set({ shippingNationalCost: cost }),
      setPickupAddress: (address: string) => set({ pickupAddress: address }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
