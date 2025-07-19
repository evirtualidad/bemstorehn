
'use client';

import { create } from 'zustand';
import type { Address } from './use-orders';
import { produce } from 'immer';
import { toast } from './use-toast';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { initialCustomers } from '@/lib/customers';

export interface Customer {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  address: Address | null;
  total_spent: number;
  order_count: number;
}

type CustomersState = {
  customers: Customer[];
  isLoading: boolean;
  fetchCustomers: () => Promise<void>;
  addOrUpdateCustomer: (
    data: {
      phone?: string;
      name: string;
      address?: Address | null;
    }
  ) => Promise<string | null>; 
  addPurchaseToCustomer: (customerId: string, amount: number) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
};

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: initialCustomers,
      isLoading: false,
      
      fetchCustomers: async () => {
          set({ isLoading: true });
          if (!isSupabaseConfigured) {
            set({ customers: initialCustomers, isLoading: false });
            return;
          }
          const { data, error } = await supabase.from('customers').select('*');
          if (error) {
            toast({ title: 'Error al cargar clientes', description: error.message, variant: 'destructive' });
            set({ customers: initialCustomers, isLoading: false });
          } else {
            set({ customers: data as Customer[], isLoading: false });
          }
      },

      addOrUpdateCustomer: async ({ phone, name, address }) => {
        if ((!phone || phone.trim() === '') && (name.trim().toLowerCase() === 'consumidor final' || name.trim() === '')) {
            return null; 
        }
        
        const existingCustomer = phone ? get().customers.find(c => c.phone === phone) : null;
        
        if (existingCustomer) {
            const updatedCustomer = {
                ...existingCustomer,
                name,
                address: address || existingCustomer.address
            };
            set(produce(state => {
                const index = state.customers.findIndex(c => c.id === updatedCustomer.id);
                if (index !== -1) {
                    state.customers[index] = updatedCustomer;
                }
            }));
            return updatedCustomer.id;
        } else {
            const newCustomer: Customer = {
                id: uuidv4(),
                created_at: new Date().toISOString(),
                name,
                phone: phone || '',
                address,
                total_spent: 0,
                order_count: 0
            };
            set(produce(state => {
                state.customers.unshift(newCustomer);
            }));
            return newCustomer.id;
        }
      },
      
      addPurchaseToCustomer: async (customerId, amount) => {
        if (!customerId) return;
        set(produce(state => {
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
      name: 'customers-storage-v3',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
