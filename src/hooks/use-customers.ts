
'use client';

import { create } from 'zustand';
import type { Address } from './use-orders';
import { produce } from 'immer';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, getDocs, writeBatch, serverTimestamp, increment } from 'firebase/firestore';

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
  ) => Promise<string | null>; // Returns customer Firestore ID or null
  addPurchaseToCustomer: (customerId: string, amount: number) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
};

export const useCustomersStore = create<CustomersState>()(
    (set, get) => ({
      customers: [],
      isLoading: true,

      fetchCustomers: () => {
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
        // Do not create a record for "Consumidor Final" without a phone number
        if ((!phone || phone.trim() === '') && (name.trim().toLowerCase() === 'consumidor final' || name.trim() === '')) {
            return null; 
        }

        const customersRef = collection(db, "customers");
        
        // Find existing customer by phone number if provided
        if (phone && phone.trim() !== '') {
            const q = query(customersRef, where("phone", "==", phone));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Update existing customer
                const customerDoc = querySnapshot.docs[0];
                await updateDoc(doc(db, 'customers', customerDoc.id), {
                    name: name,
                    ...(address && { address }),
                });
                return customerDoc.id;
            }
        }
        
        // If no customer found or no phone provided, create a new one
        const newCustomerData = {
            name,
            phone: phone || '',
            address: address || null,
            total_spent: 0,
            order_count: 0,
            created_at: serverTimestamp(),
        };
        const docRef = await addDoc(customersRef, newCustomerData);
        return docRef.id;
      },
      
      addPurchaseToCustomer: async (customerId, amount) => {
        if (!customerId) return;
        const customerRef = doc(db, 'customers', customerId);
        await updateDoc(customerRef, {
            total_spent: increment(amount),
            order_count: increment(1)
        });
      },

      getCustomerById: (id) => {
        return get().customers.find((c) => c.id === id);
      },
    })
);

// Initialize store
useCustomersStore.getState().fetchCustomers();
