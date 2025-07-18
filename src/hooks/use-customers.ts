
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
    }
  ) => Promise<string | undefined>; // Returns customer ID
  addPurchaseToCustomer: (customerId: string, amount: number) => void;
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
  
  addOrUpdateCustomer: async ({ phone, name, address }) => {
    if ((!phone || phone.trim() === '') && name.trim().toLowerCase() === 'consumidor final') {
        return undefined; // Do not create/update "Consumidor Final"
    }

    let customerId: string | undefined = undefined;

    set(produce((state: CustomersState) => {
        const existingCustomer = state.customers.find(c => c.phone && c.phone.trim() !== '' && c.phone === phone);

        if (existingCustomer) {
            existingCustomer.name = name;
            existingCustomer.address = address || existingCustomer.address;
            customerId = existingCustomer.id;
        } else {
            const newCustomer: Customer = {
                id: uuidv4(),
                created_at: new Date().toISOString(),
                phone: phone || '',
                name,
                address: address || null,
                total_spent: 0,
                order_count: 0,
            };
            state.customers.push(newCustomer);
            customerId = newCustomer.id;
        }
    }));
    
    return customerId;
  },
  
  addPurchaseToCustomer: (customerId, amount) => {
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
}));

useCustomersStore.getState().fetchCustomers();
