
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
            const trimmedName = name.trim();
            const trimmedPhone = phone?.trim();

            if (!trimmedName || trimmedName.toLowerCase() === 'consumidor final') {
                return null; // Return null for general consumer, no DB entry needed.
            }
            
            try {
                // Try to find an existing customer
                let existingCustomer: Customer | null = null;
                if (trimmedPhone) {
                    const { data } = await supabase.from('customers').select('*').eq('phone', trimmedPhone).single();
                    existingCustomer = data;
                }

                if (existingCustomer) {
                    // Update existing customer if name or address is different
                    if (existingCustomer.name !== trimmedName || JSON.stringify(existingCustomer.address) !== JSON.stringify(address)) {
                         const { data: updatedCustomer, error } = await supabase
                            .from('customers')
                            .update({ name: trimmedName, address: address || existingCustomer.address })
                            .eq('id', existingCustomer.id)
                            .select()
                            .single();
                        if (error) throw error;
                        
                        set(produce((state: CustomersState) => {
                            const index = state.customers.findIndex(c => c.id === updatedCustomer.id);
                            if (index !== -1) state.customers[index] = updatedCustomer;
                        }));
                    }
                    return existingCustomer.id;
                } else {
                    // Insert new customer
                    const { data: newCustomer, error } = await supabase
                        .from('customers')
                        .insert({ name: trimmedName, phone: trimmedPhone, address })
                        .select()
                        .single();

                    if (error) throw error;
                    
                    set(produce((state: CustomersState) => {
                        state.customers.unshift(newCustomer);
                    }));
                    return newCustomer.id;
                }
            } catch (error: any) {
                toast({ title: 'Error al gestionar cliente', description: error.message, variant: 'destructive' });
                return null;
            }
        },
        
        addPurchaseToCustomer: async (customerId, amount) => {
            if (!customerId) return;
            // The RPC function `increment_customer_stats` will handle this atomically on the server.
            // No need to fetch and update from the client.
            const { error } = await supabase.rpc('increment_customer_stats', {
                p_customer_id: customerId,
                p_purchase_amount: amount
            });

            if (error) {
                 console.error('Error updating customer stats via RPC:', error.message);
                 toast({ title: 'Error al actualizar estadísticas', description: 'No se pudo actualizar el total de compras del cliente.', variant: 'destructive' });
            } else {
                // Optimistically update the local state
                set(produce((state: CustomersState) => {
                    const customer = state.customers.find(c => c.id === customerId);
                    if (customer) {
                        customer.total_spent += amount;
                        customer.order_count += 1;
                    }
                }));
            }
        },

        getCustomerById: (id) => {
          return get().customers.find((c) => c.id === id);
        },
    })
);
