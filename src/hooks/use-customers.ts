
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from './use-toast';
import { v4 as uuidv4 } from 'uuid';
import { initialCustomers } from '@/lib/customers';
import type { Customer, Address } from '@/lib/types';
import { persist, createJSONStorage } from 'zustand/middleware';

type CustomersState = {
  customers: Customer[];
  isLoading: boolean;
  fetchCustomers: () => void;
  addOrUpdateCustomer: (
    data: {
      phone?: string;
      name: string;
      address?: Address | null;
    }
  ) => string | null; 
  addPurchaseToCustomer: (customerId: string, amount: number) => void;
  getCustomerById: (id: string) => Customer | undefined;
};

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
        customers: initialCustomers,
        isLoading: true,
        
        fetchCustomers: () => {
            set({ isLoading: false });
        },

        addOrUpdateCustomer: ({ phone, name, address }) => {
          let customerId: string | null = null;
          if ((!phone || phone.trim() === '') && (name.trim().toLowerCase() === 'consumidor final' || name.trim() === '')) {
              return null; 
          }
          
          set(produce((state: CustomersState) => {
            const existingCustomer = phone ? state.customers.find(c => c.phone === phone) : null;
            
            if (existingCustomer) {
                existingCustomer.name = name;
                existingCustomer.address = address || existingCustomer.address;
                customerId = existingCustomer.id;
            } else {
                const newCustomer: Customer = {
                    id: uuidv4(),
                    created_at: new Date().toISOString(),
                    name,
                    phone: phone || '',
                    address: address || null,
                    total_spent: 0,
                    order_count: 0
                };
                state.customers.unshift(newCustomer);
                customerId = newCustomer.id;
            }
          }));
          return customerId;
        },
        
        addPurchaseToCustomer: (customerId, amount) => {
          if (!customerId) return;
          set(produce((state: CustomersState) => {
            const customer = state.customers.find(c => c.id === customerId);
            if (customer) {
                customer.total_spent += amount;
                customer.order_count += 1;
            }
          }));
        },

        getCustomerById: (id) => {
          return get().customers.find((c) => c.id === id);
        },
    }),
    {
      name: 'bem-customers-storage',
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: () => (state) => {
        if (state) {
            state.isLoading = false;
        }
      },
    }
  )
);
