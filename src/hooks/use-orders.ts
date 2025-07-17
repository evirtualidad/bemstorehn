
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';

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
  id: string; // uuid from Supabase
  display_id: string;
  created_at: string;
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

export type NewOrderData = Omit<Order, 'id' | 'display_id' | 'created_at' | 'customer_id'>;

let mockOrders: Order[] = []; // Start with an empty array

type OrdersState = {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: () => Promise<void>;
  addOrder: (orderData: NewOrderData) => Promise<Order | null>;
  addPayment: (orderId: string, amount: number, method: 'efectivo' | 'tarjeta' | 'transferencia') => Promise<void>;
  approveOrder: (data: { orderId: string, paymentMethod: Order['payment_method'], paymentDueDate?: Date, paymentReference?: string }) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
};

const generateMockOrder = (orderData: NewOrderData): Order => {
  const id = `order-${Date.now()}`;
  const display_id = `BEM-${Date.now().toString().slice(-6)}`;
  return {
    ...orderData,
    id,
    display_id,
    created_at: new Date().toISOString(),
    customer_id: `cust-${Date.now()}` // Mock customer id
  };
};

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  isLoading: false,

  fetchOrders: async () => {
    set({ isLoading: true });
    setTimeout(() => {
        set({ orders: mockOrders, isLoading: false });
    }, 500);
  },

  addOrder: async (orderData) => {
    set({ isLoading: true });
    const newOrder = generateMockOrder(orderData);
    mockOrders = [newOrder, ...mockOrders]; // Add to the mock "DB"
    set({ orders: mockOrders, isLoading: false });
    return newOrder;
  },

  addPayment: async (orderId, amount, method) => {
    set(produce((state: OrdersState) => {
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
            order.balance -= amount;
            order.payments.push({ amount, method, date: new Date().toISOString() });
            if (order.balance <= 0) {
                order.status = 'paid';
            }
        }
    }));
  },

  approveOrder: async ({ orderId, paymentMethod, paymentDueDate, paymentReference }) => {
    set(produce((state: OrdersState) => {
        const order = state.orders.find(o => o.id === orderId);
        if (order && order.status === 'pending-approval') {
            order.payment_method = paymentMethod;
            order.payment_due_date = paymentDueDate ? paymentDueDate.toISOString() : order.payment_due_date;
            order.payment_reference = paymentReference || order.payment_reference;
            
            if (paymentMethod === 'credito') {
                order.status = 'pending-payment';
                order.balance = order.total;
            } else {
                order.status = 'paid';
                order.balance = 0;
                order.payments = [{ amount: order.total, date: new Date().toISOString(), method: paymentMethod }];
            }
        }
    }));
  },

  cancelOrder: async (orderId) => {
    set(produce((state: OrdersState) => {
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'cancelled';
        }
    }));
  },

  getOrderById: (orderId: string) => {
    return get().orders.find((o) => o.display_id === orderId || o.id === orderId);
  },
}));
