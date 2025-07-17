
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import type { Address } from './use-orders';
import { produce } from 'immer';

export interface Customer {
  id: string; // uuid
  created_at: string;
  name: string;
  phone: string;
  address: Address | null;
  total_spent: number;
  order_count: number;
}

// Mock Data
const mockCustomers: Customer[] = [
    {
        id: 'cust-1',
        created_at: new Date().toISOString(),
        name: 'Elena Rodriguez',
        phone: '9876-5432',
        address: { department: 'Francisco Morazán', municipality: 'Distrito Central', colony: 'Lomas del Guijarro', exactAddress: 'Casa #123' },
        total_spent: 1500,
        order_count: 3
    },
    {
        id: 'cust-2',
        created_at: new Date().toISOString(),
        name: 'Carlos Mendoza',
        phone: '3344-5566',
        address: null,
        total_spent: 850,
        order_count: 2
    }
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
      order_id: string;
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
    // Simulate API call
    setTimeout(() => {
        set({ customers: mockCustomers, isLoading: false });
    }, 500);
  },
  
  addOrUpdateCustomer: async ({ phone, name, address, order_id, total_to_add }) => {
    let customerId: string | undefined = undefined;
    set(produce((state: CustomersState) => {
        const existingCustomerIndex = state.customers.findIndex(c => c.phone === phone);
        
        if (existingCustomerIndex !== -1) {
            // Update existing customer
            const customer = state.customers[existingCustomerIndex];
            customer.name = name;
            customer.address = address || customer.address;
            customer.total_spent += total_to_add;
            customer.order_count += 1;
            customerId = customer.id;
        } else {
            // Add new customer
            const newCustomer: Customer = {
                id: `cust-${Date.now()}`,
                created_at: new Date().toISOString(),
                phone,
                name,
                address: address || null,
                total_spent: total_to_add,
                order_count: 1
            };
            state.customers.push(newCustomer);
            customerId = newCustomer.id;
        }
    }));
    toast({ title: 'Cliente guardado', description: `Se guardaron los datos para ${name}` });
    return customerId;
  },

  getCustomerById: (id) => {
    return get().customers.find((c) => c.id === id);
  },
}));
