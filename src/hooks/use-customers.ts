
'use client';

import { create } from 'zustand';
import type { Address } from './use-orders';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { subDays } from 'date-fns';

export interface Customer {
  id: string;
  created_at: any;
  name: string;
  phone: string;
  address: Address | null;
  total_spent: number;
  order_count: number;
}

const initialCustomers: Customer[] = [
    {
        id: 'cust_1',
        name: 'Ana García',
        phone: '9988-7766',
        address: { department: 'Francisco Morazán', municipality: 'Distrito Central', colony: 'Col. Kennedy', exactAddress: 'Bloque 5, Casa 20' },
        total_spent: 1520.50,
        order_count: 3,
        created_at: subDays(new Date(), 30).toISOString(),
    },
    {
        id: 'cust_2',
        name: 'Carlos Rivera',
        phone: '3322-1100',
        address: { department: 'Cortés', municipality: 'San Pedro Sula', colony: 'Res. Los Alpes', exactAddress: 'Circuito 5, Casa 12' },
        total_spent: 890.00,
        order_count: 2,
        created_at: subDays(new Date(), 60).toISOString(),
    },
     {
        id: 'cust_3',
        name: 'Sofía Martínez',
        phone: '8787-9090',
        address: null,
        total_spent: 350.00,
        order_count: 1,
        created_at: subDays(new Date(), 15).toISOString(),
    }
];

type CustomersState = {
  customers: Customer[];
  isLoading: boolean;
  addOrUpdateCustomer: (
    data: {
      phone?: string;
      name: string;
      address?: Address | null;
    }
  ) => Promise<string | null>; // Returns customer ID or null
  addPurchaseToCustomer: (customerId: string, amount: number) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
};

export const useCustomersStore = create<CustomersState>()(
    (set, get) => ({
      customers: initialCustomers,
      isLoading: false,

      addOrUpdateCustomer: async ({ phone, name, address }) => {
        if ((!phone || phone.trim() === '') && (name.trim().toLowerCase() === 'consumidor final' || name.trim() === '')) {
            return null; 
        }

        const existingCustomer = phone ? get().customers.find(c => c.phone === phone) : null;
        
        if (existingCustomer) {
            set(produce(state => {
                const customer = state.customers.find(c => c.id === existingCustomer.id);
                if (customer) {
                    customer.name = name;
                    if (address) {
                        customer.address = address;
                    }
                }
            }));
            return existingCustomer.id;
        } else {
            const newCustomer: Customer = {
                id: uuidv4(),
                name,
                phone: phone || '',
                address: address || null,
                total_spent: 0,
                order_count: 0,
                created_at: new Date().toISOString(),
            };
            set(produce(state => {
                state.customers.push(newCustomer);
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
    })
);
