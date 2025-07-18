
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import type { Address } from './use-orders';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';

export interface Customer {
  id: string; // uuid
  created_at: string;
  name: string;
  phone: string;
  address: Address | null;
  total_spent: number;
  order_count: number;
}

const mockCustomers: Customer[] = [
    { id: 'cust_1', created_at: new Date().toISOString(), name: 'Elena Rodriguez', phone: '9876-5432', address: { department: 'Francisco Morazán', municipality: 'Distrito Central', colony: 'Lomas del Guijarro', exactAddress: 'Casa #123, Calle Principal' }, total_spent: 350.50, order_count: 3 },
    { id: 'cust_2', created_at: new Date().toISOString(), name: 'Carlos Gomez', phone: '3322-1100', address: null, total_spent: 120.00, order_count: 1 },
    { id: 'cust_3', created_at: new Date().toISOString(), name: 'Ana Martinez', phone: '8877-6655', address: { department: 'Cortés', municipality: 'San Pedro Sula', colony: 'Col. Jardines del Valle', exactAddress: 'Bloque 5, Casa 10' }, total_spent: 580.00, order_count: 5 },
];

type CustomersState = {
  customers: Customer[];
  isLoading: boolean;
  fetchCustomers: () => Promise<void>;
  addOrUpdateCustomer: (
    data: {
      phone: string;
      name: string;
      address?: Address | null;
      total_to_add: number;
    }
  ) => Promise<string | undefined>; // Returns customer ID
  getCustomerById: (id: string) => Customer | undefined;
};

export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: [],
  isLoading: false,
  fetchCustomers: async () => {
    set({ isLoading: true });
    // Simulate network delay
    setTimeout(() => {
        set({ customers: mockCustomers, isLoading: false });
    }, 500);
  },
  
  addOrUpdateCustomer: async ({ phone, name, address, total_to_add }) => {
    if (!phone && !name) {
        return undefined; // Do not create/update "Consumidor Final"
    }

    let customerId: string | undefined = undefined;

    set(produce((state: CustomersState) => {
        const existingCustomer = state.customers.find(c => c.phone === phone);

        if (existingCustomer) {
            existingCustomer.name = name;
            existingCustomer.address = address || existingCustomer.address;
            existingCustomer.total_spent += total_to_add;
            existingCustomer.order_count += 1;
            customerId = existingCustomer.id;
        } else {
            const newCustomer: Customer = {
                id: uuidv4(),
                created_at: new Date().toISOString(),
                phone,
                name,
                address: address || null,
                total_spent: total_to_add,
                order_count: 1,
            };
            state.customers.push(newCustomer);
            customerId = newCustomer.id;
        }
    }));
    
    return customerId;
  },

  getCustomerById: (id) => {
    return get().customers.find((c) => c.id === id);
  },
}));

useCustomersStore.getState().fetchCustomers();
