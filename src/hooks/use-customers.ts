
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from './use-toast';
import { supabase } from '@/lib/supabase';
import type { Customer, Address } from '@/lib/types';

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
  (set, get) => ({
        customers: [],
        isLoading: true,
        
        fetchCustomers: async () => {
            set({ isLoading: true });
            const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
            if (error) {
                toast({ title: 'Error al cargar clientes', description: error.message, variant: 'destructive' });
                set({ customers: [], isLoading: false });
            } else {
                set({ customers: data, isLoading: false });
            }
        },

        addOrUpdateCustomer: async ({ phone, name, address }) => {
            if ((!phone || phone.trim() === '') && (name.trim().toLowerCase() === 'consumidor final' || name.trim() === '')) {
                return null;
            }

            // Check if customer exists by phone
            let existingCustomer: Customer | null = null;
            if (phone) {
                const { data } = await supabase.from('customers').select('*').eq('phone', phone).single();
                existingCustomer = data;
            }

            if (existingCustomer) {
                // Update existing customer
                const { data: updatedCustomer, error } = await supabase
                    .from('customers')
                    .update({ name: name, address: address || existingCustomer.address })
                    .eq('id', existingCustomer.id)
                    .select()
                    .single();
                
                if (error) {
                    toast({ title: 'Error al actualizar cliente', description: error.message, variant: 'destructive' });
                    return null;
                }
                
                set(produce((state: CustomersState) => {
                    const index = state.customers.findIndex(c => c.id === updatedCustomer.id);
                    if (index !== -1) state.customers[index] = updatedCustomer;
                }));
                return updatedCustomer.id;

            } else {
                // Insert new customer
                const { data: newCustomer, error } = await supabase
                    .from('customers')
                    .insert({ name, phone, address })
                    .select()
                    .single();

                if (error) {
                     toast({ title: 'Error al crear cliente', description: error.message, variant: 'destructive' });
                    return null;
                }
                
                set(produce((state: CustomersState) => {
                    state.customers.unshift(newCustomer);
                }));
                return newCustomer.id;
            }
        },
        
        addPurchaseToCustomer: async (customerId, amount) => {
            if (!customerId) return;
            const customer = get().customers.find(c => c.id === customerId);
            if (!customer) return;

            const newTotalSpent = customer.total_spent + amount;
            const newOrderCount = customer.order_count + 1;

            const { error } = await supabase
                .from('customers')
                .update({ total_spent: newTotalSpent, order_count: newOrderCount })
                .eq('id', customerId);
            
            if (error) {
                toast({ title: 'Error actualizando compra del cliente', description: error.message, variant: 'destructive' });
            } else {
                set(produce((state: CustomersState) => {
                    const customerToUpdate = state.customers.find(c => c.id === customerId);
                    if (customerToUpdate) {
                        customerToUpdate.total_spent = newTotalSpent;
                        customerToUpdate.order_count = newOrderCount;
                    }
                }));
            }
        },

        getCustomerById: (id) => {
          return get().customers.find((c) => c.id === id);
        },
    })
);
