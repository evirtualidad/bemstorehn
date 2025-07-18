
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp, increment } from 'firebase/firestore';

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
  id: string; // Firestore document ID
  display_id: string;
  created_at: any; // Firestore timestamp
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
  fetchOrders: () => () => void; // Returns unsubscribe function
  addOrderToState: (order: NewOrderData) => Promise<string>; // Returns the new order ID
  addPayment: (orderId: string, amount: number, method: 'efectivo' | 'tarjeta' | 'transferencia') => Promise<void>;
  approveOrder: (data: { orderId: string, paymentMethod: Order['payment_method'], paymentDueDate?: Date, paymentReference?: string }) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
};

// Function to generate a shorter, human-readable display ID
const generateDisplayId = () => {
  const timestamp = new Date().getTime().toString().slice(-6); // Last 6 digits of timestamp
  const random = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars
  return `${random}-${timestamp}`;
};

export const useOrdersStore = create<OrdersState>()(
    (set, get) => ({
      orders: [],
      isLoading: true,

      fetchOrders: () => {
          const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
          const unsubscribe = onSnapshot(q, (snapshot) => {
              const orders = snapshot.docs.map(doc => {
                  const data = doc.data();
                  return { 
                      id: doc.id,
                      ...data,
                      // Convert Firestore Timestamps to ISO strings for consistency
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
        const newOrder = {
            ...orderData,
            display_id: generateDisplayId(),
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
        
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            balance: newBalance,
            status: newStatus,
            payments: [...order.payments, newPayment]
        });
        toast({ title: 'Pago Registrado', description: 'El pago se registró con éxito.' });
      },

      approveOrder: async ({ orderId, paymentMethod, paymentDueDate, paymentReference }) => {
        const orderRef = doc(db, 'orders', orderId);
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

        await updateDoc(orderRef, updateData);
        toast({ title: 'Pedido Aprobado', description: 'El pedido ha sido facturado.' });
      },

      cancelOrder: async (orderId: string) => {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: 'cancelled' });
        toast({ title: 'Pedido Cancelado', variant: 'destructive' });
      },

      getOrderById: (orderId: string) => {
        return get().orders.find((o) => o.display_id === orderId || o.id === orderId);
      },
    })
);

// Initialize listener for orders
useOrdersStore.getState().fetchOrders();
