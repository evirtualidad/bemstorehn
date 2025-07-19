
'use client';

import { create } from 'zustand';
import type { Address } from './use-orders';
import { produce } from 'immer';
import { toast } from './use-toast';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';


export interface Customer {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  address: Address | null;
  total_spent: number;
  order_count: number;
}

const initialCustomers: Customer[] = [
    {
        id: 'cust-1',
        created_at: '2023-01-15T10:00:00Z',
        name: 'Elena Rodríguez',
        phone: '9988-7766',
        address: {
            department: 'Francisco Morazán',
            municipality: 'Distrito Central',
            colony: 'Col. Palmira',
            exactAddress: 'Frente a la embajada, casa 123'
        },
        total_spent: 1500,
        order_count: 3
    },
    {
        id: 'cust-2',
        created_at: '2023-02-20T14:30:00Z',
        name: 'Carlos Portillo',
        phone: '3322-1100',
        address: null,
        total_spent: 850,
        order_count: 1
    }
];

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
          set({ isLoading: false });
      },

      addOrUpdateCustomer: async ({ phone, name, address }) => {
        if ((!phone || phone.trim() === '') && (name.trim().toLowerCase() === 'consumidor final' || name.trim() === '')) {
            return null; 
        }
        
        const existingCustomer = phone ? get().customers.find(c => c.phone === phone) : null;
        
        if (existingCustomer) {
            // Update customer
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
            // Create customer
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
      name: 'customers-storage',
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      }
    }
  )
);
