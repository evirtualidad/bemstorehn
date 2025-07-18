
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Payment {
    date: string;
    amount: number;
    method: 'efectivo' | 'tarjeta' | 'transferencia';
    cash_received?: number | null;
    change_given?: number | null;
}

export interface Address {
  department: string;
  municipality: string;
  colony?: string;
  exactAddress: string;
}

export interface Order {
  id: string; // Firestore document ID or mock UUID
  display_id: string;
  created_at: any; // Firestore timestamp or ISO string
  user_id: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: Address | null;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  total: number;
  shipping_cost: number;
  balance: number; 
  payments: Payment[]; 
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';
  payment_reference: string | null;
  status: 'pending-approval' | 'pending-payment' | 'paid' | 'cancelled';
  source: 'pos' | 'online-store';
  delivery_method: 'pickup' | 'delivery' | null;
  payment_due_date: string | null;
}

export type NewOrderData = Omit<Order, 'id' | 'display_id' | 'created_at'>;

type OrdersState = {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: () => () => void;
  addOrderToState: (order: NewOrderData) => Promise<string>; // Returns the new order ID
  addPayment: (orderId: string, amount: number, method: 'efectivo' | 'tarjeta' | 'transferencia') => Promise<void>;
  approveOrder: (data: { orderId: string, paymentMethod: Order['payment_method'], paymentDueDate?: Date, paymentReference?: string }) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
};

// Mock data for local development without Firebase
const getInitialOrders = (): Order[] => []; // Start with an empty list

const generateDisplayId = () => {
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${random}-${timestamp}`;
};

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: getInitialOrders(),
      isLoading: true,

      fetchOrders: () => {
        if (!db) {
            console.log("SIMULATION: Firebase not configured, using mock orders.");
            set({ orders: getInitialOrders(), isLoading: false });
            return () => {}; // Return an empty unsubscribe function
        }

        set({ isLoading: true });
        const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    created_at: data.created_at?.toDate()?.toISOString() || new Date().toISOString(),
                } as Order;
            });
            set({ orders, isLoading: false });
        }, (error) => {
            console.error("Firebase Error fetching orders:", error);
            set({ isLoading: false });
        });
        return unsubscribe;
      },

      addOrderToState: async (orderData) => {
        const display_id = generateDisplayId();
        if (!db) {
            console.log("SIMULATION: Adding mock order.");
            const newOrder: Order = {
                ...orderData,
                id: uuidv4(),
                display_id,
                created_at: new Date().toISOString(),
            };
            set(produce(state => { state.orders.unshift(newOrder) }));
            return newOrder.id;
        }

        const newOrder = {
            ...orderData,
            display_id,
            created_at: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'orders'), newOrder);
        return docRef.id;
      },

      addPayment: async (orderId, amount, method) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order) return;

        const newBalance = order.balance - amount;
        const newStatus = newBalance <= 0 ? 'paid' : order.status;
        const newPayment: Payment = { amount, method, date: new Date().toISOString() };

        if (!db) {
            set(produce(state => {
                const o = state.orders.find(ord => ord.id === orderId);
                if (o) {
                    o.balance = newBalance;
                    o.status = newStatus;
                    o.payments.push(newPayment);
                }
            }));
            toast({ title: 'Pago (sim) Registrado' });
            return;
        }
        
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            balance: newBalance,
            status: newStatus,
            payments: [...order.payments, newPayment]
        });
        toast({ title: 'Pago Registrado', description: 'El pago se registró con éxito.' });
      },

      approveOrder: async ({ orderId, paymentMethod, paymentDueDate, paymentReference }) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order) return;

        const updateData: Partial<Order> = {
            payment_method: paymentMethod,
            payment_due_date: paymentDueDate ? paymentDueDate.toISOString() : null,
            payment_reference: paymentReference || null,
        };

        if (paymentMethod === 'credito') {
            updateData.status = 'pending-payment';
            updateData.balance = order.total;
        } else {
            updateData.status = 'paid';
            updateData.balance = 0;
            updateData.payments = [{ amount: order.total, date: new Date().toISOString(), method: paymentMethod }];
        }

        if (!db) {
            set(produce(state => {
                const o = state.orders.find(ord => ord.id === orderId);
                if (o) {
                    Object.assign(o, updateData);
                }
            }));
            toast({ title: 'Pedido (sim) Aprobado' });
            return;
        }
        
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, updateData);
        toast({ title: 'Pedido Aprobado', description: 'El pedido ha sido facturado.' });
      },

      cancelOrder: async (orderId: string) => {
        if (!db) {
            set(produce(state => {
                const o = state.orders.find(ord => ord.id === orderId);
                if (o) o.status = 'cancelled';
            }));
            toast({ title: 'Pedido (sim) Cancelado', variant: 'destructive' });
            return;
        }
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: 'cancelled' });
        toast({ title: 'Pedido Cancelado', variant: 'destructive' });
      },

      getOrderById: (orderId: string) => {
        return get().orders.find((o) => o.display_id === orderId || o.id === orderId);
      },
    }),
    {
      name: 'orders-storage-v1', // Unique key for local storage
      storage: createJSONStorage(() => localStorage),
       // Only persist if Firebase is not configured
      skipHydration: !!db,
    }
  )
);
