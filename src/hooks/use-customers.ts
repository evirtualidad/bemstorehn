
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from './use-toast';
import { v4 as uuidv4 } from 'uuid';
import { initialCustomers } from '@/lib/customers';
import type { Customer, Address } from '@/lib/types';

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

export const useCustomersStore = create<CustomersState>()((set, get) => ({
    customers: [],
    isLoading: true,
    
    fetchCustomers: () => {
        set({ customers: initialCustomers, isLoading: false });
    },

    addOrUpdateCustomer: ({ phone, name, address }) => {
      if ((!phone || phone.trim() === '') && (name.trim().toLowerCase() === 'consumidor final' || name.trim() === '')) {
          return null; 
      }
      
      const existingCustomer = phone ? initialCustomers.find(c => c.phone === phone) : null;
      
      if (existingCustomer) {
          existingCustomer.name = name;
          existingCustomer.address = address || existingCustomer.address;
          set({ customers: [...initialCustomers] });
          return existingCustomer.id;
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
          initialCustomers.unshift(newCustomer);
          set({ customers: [...initialCustomers] });
          return newCustomer.id;
      }
    },
    
    addPurchaseToCustomer: (customerId, amount) => {
      if (!customerId) return;
      const customer = initialCustomers.find(c => c.id === customerId);
      if (customer) {
          customer.total_spent += amount;
          customer.order_count += 1;
      }
      set({ customers: [...initialCustomers] });
    },

    getCustomerById: (id) => {
      return get().customers.find((c) => c.id === id);
    },
}));
