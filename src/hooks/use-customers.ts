
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Address, Order } from './use-orders';

export interface Customer {
  id: string; // Based on phone number
  name: string;
  phone: string;
  address?: Address;
  orderIds: string[];
  totalSpent: number;
}

const initialCustomers: Customer[] = [
    { id: 'cust_555-0101', name: 'Olivia Martin', phone: '555-0101', orderIds: ['ORD-001'], totalSpent: 35.00 },
    { id: 'cust_555-0102', name: 'Jackson Lee', phone: '555-0102', orderIds: ['ORD-002'], totalSpent: 104.00 },
    { id: 'cust_555-0103', name: 'Isabella Nguyen', phone: '555-0103', orderIds: ['ORD-003'], totalSpent: 26.00 },
    { id: 'cust_555-0109', name: 'Mason Garcia', phone: '555-0109', orderIds: ['ORD-009-ONLINE'], totalSpent: 36.00 },
    { id: 'cust_555-0105', name: 'Sophia Rodriguez', phone: '555-0105', orderIds: ['ORD-005'], totalSpent: 72.00 },
    { id: 'cust_555-0106', name: 'Liam Johnson', phone: '555-0106', orderIds: ['ORD-006'], totalSpent: 28.00 },
];

type CustomersState = {
  customers: Customer[];
  addOrUpdateCustomer: (data: {
    id: string;
    name: string;
    phone: string;
    address?: Address;
    orderIds: string[];
    totalSpent: number;
  }) => void;
  getCustomerById: (id: string) => Customer | undefined;
};

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: initialCustomers,
      addOrUpdateCustomer: (data) => {
        set((state) => {
          const existingCustomer = state.customers.find((c) => c.id === data.id);
          if (existingCustomer) {
            // Update existing customer
            return {
              customers: state.customers.map((c) =>
                c.id === data.id
                  ? {
                      ...c,
                      name: data.name, // Update name in case it changes
                      address: data.address || c.address, // Update address if a new one is provided
                      orderIds: [...c.orderIds, ...data.orderIds],
                      totalSpent: c.totalSpent + data.totalSpent,
                    }
                  : c
              ),
            };
          } else {
            // Add new customer
            return {
              customers: [...state.customers, data],
            };
          }
        });
      },
      getCustomerById: (id) => {
        return get().customers.find((c) => c.id === id);
      },
    }),
    {
      name: 'customers-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
