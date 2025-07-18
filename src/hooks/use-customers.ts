
'use client';

import { create } from 'zustand';
import type { Address } from './use-orders';
import { produce } from 'immer';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, getDocs, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Customer {
  id: string; // Firestore document ID
  created_at: any; // Firestore timestamp
  name: string;
  phone: string;
  address: Address | null;
  total_spent: number;
  order_count: number;
}

type CustomersState = {
  customers: Customer[];
  isLoading: boolean;
  fetchCustomers: () => () => void;
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

const getInitialCustomers = (): Customer[] => [
    {
        id: 'cust_1',
        name: 'Cliente Frecuente',
        phone: '9988-7766',
        address: { department: 'Francisco Morazán', municipality: 'Distrito Central', colony: 'Col. Palmira', exactAddress: 'Casa #123, frente al parque' },
        total_spent: 1520.50,
        order_count: 4,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'cust_2',
        name: 'Nuevo Comprador',
        phone: '3344-5522',
        address: null,
        total_spent: 350.00,
        order_count: 1,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
];

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: getInitialCustomers(),
      isLoading: true,

      fetchCustomers: () => {
        if (!db) {
            console.log("SIMULATION: Firebase not configured, using mock customers.");
            set({ customers: getInitialCustomers(), isLoading: false });
            return () => {};
        }

        set({ isLoading: true });
        const q = query(collection(db, 'customers'), where('order_count', '>', 0));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
            set({ customers, isLoading: false });
        }, (error) => {
            console.error("Firebase Error fetching customers: ", error);
            set({ isLoading: false });
        });
        return unsubscribe;
      },

      addOrUpdateCustomer: async ({ phone, name, address }) => {
        if ((!phone || phone.trim() === '') && (name.trim().toLowerCase() === 'consumidor final' || name.trim() === '')) {
            return null; // Don't create a record for "Consumidor Final"
        }

        if (!db) {
            console.log("SIMULATION: Adding/updating mock customer.");
            const existingCustomer = get().customers.find(c => c.phone === phone);
            if (existingCustomer) {
                set(produce((state: CustomersState) => {
                    const customer = state.customers.find(c => c.id === existingCustomer.id);
                    if (customer) {
                        customer.name = name;
                        if (address) customer.address = address;
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
                set(produce((state: CustomersState) => {
                    state.customers.push(newCustomer);
                }));
                return newCustomer.id;
            }
        }

        const customersRef = collection(db, "customers");
        const q = query(customersRef, where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const customerDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, 'customers', customerDoc.id), {
                name: name,
                ...(address && { address }),
            });
            return customerDoc.id;
        } else {
            const newCustomerData = {
                name,
                phone: phone || '',
                address: address || null,
                total_spent: 0,
                order_count: 0,
                created_at: serverTimestamp(),
            };
            const docRef = await addDoc(collection(db, "customers"), newCustomerData);
            return docRef.id;
        }
      },
      
      addPurchaseToCustomer: async (customerId, amount) => {
        if (!db) {
             console.log("SIMULATION: Adding purchase to mock customer.");
             set(produce((state: CustomersState) => {
                 const customer = state.customers.find(c => c.id === customerId);
                 if (customer) {
                     customer.total_spent += amount;
                     customer.order_count += 1;
                 }
             }));
             return;
        }
        const customerRef = doc(db, 'customers', customerId);
        await updateDoc(customerRef, {
            total_spent: increment(amount),
            order_count: increment(1)
        });
      },

      getCustomerById: (id) => {
        return get().customers.find((c) => c.id === id);
      },
    }),
    {
      name: 'customers-storage-v1', // Unique key for local storage
      storage: createJSONStorage(() => localStorage),
      // Only persist if Firebase is not configured
      skipHydration: !!db,
    }
  )
);
