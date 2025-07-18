
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import type { Product } from '@/lib/products';

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

export type NewOrderData = Omit<Order, 'id' | 'display_id' | 'created_at'>;

type OrdersState = {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: () => Promise<void>;
  addOrderToState: (order: NewOrderData) => void;
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

const mockOrders: Order[] = [
    {
        id: 'ord_1',
        display_id: 'RNDM-123456',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        user_id: 'user_1',
        customer_id: 'cust_1',
        customer_name: 'Elena Rodriguez',
        customer_phone: '9876-5432',
        customer_address: { department: 'Francisco Morazán', municipality: 'Distrito Central', colony: 'Lomas del Guijarro', exactAddress: 'Casa #123, Calle Principal' },
        items: [{ id: 'prod_001', name: 'Glow Serum', price: 35.00, quantity: 2, image: 'https://placehold.co/400x400.png' }],
        total: 70.00,
        shipping_cost: 0,
        balance: 0,
        payments: [{ date: new Date().toISOString(), amount: 70.00, method: 'tarjeta' }],
        payment_method: 'tarjeta',
        payment_reference: '12345',
        status: 'paid',
        source: 'online-store',
        delivery_method: 'delivery',
        payment_due_date: null,
    },
    {
        id: 'ord_2',
        display_id: 'ABCD-654321',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        user_id: 'user_2',
        customer_id: 'cust_2',
        customer_name: 'Carlos Gomez',
        customer_phone: '3322-1100',
        customer_address: null,
        items: [
            { id: 'prod_003', name: 'Velvet Matte Lipstick', price: 24.00, quantity: 1, image: 'https://placehold.co/400x400.png' },
            { id: 'prod_008', name: 'Waterproof Mascara', price: 26.00, quantity: 1, image: 'https://placehold.co/400x400.png' },
        ],
        total: 50.00,
        shipping_cost: 0,
        balance: 50.00,
        payments: [],
        payment_method: 'credito',
        payment_reference: null,
        status: 'pending-payment',
        source: 'pos',
        delivery_method: 'pickup',
        payment_due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
     {
        id: 'ord_3',
        display_id: 'WXYZ-987654',
        created_at: new Date().toISOString(),
        user_id: null,
        customer_id: 'cust_3',
        customer_name: 'Ana Martinez',
        customer_phone: '8877-6655',
        customer_address: { department: 'Cortés', municipality: 'San Pedro Sula', colony: 'Col. Jardines del Valle', exactAddress: 'Bloque 5, Casa 10' },
        items: [
            { id: 'prod_007', name: 'Purifying Clay Mask', price: 28.00, quantity: 1, image: 'https://placehold.co/400x400.png' },
        ],
        total: 28.00,
        shipping_cost: 150,
        balance: 28.00,
        payments: [],
        payment_method: 'transferencia',
        payment_reference: null,
        status: 'pending-approval',
        source: 'online-store',
        delivery_method: 'delivery',
        payment_due_date: null,
    },
];

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  isLoading: false,

  fetchOrders: async () => {
    set({ isLoading: true });
    // Simulate network delay
    setTimeout(() => {
        set({ orders: mockOrders, isLoading: false });
    }, 500);
  },

  addOrderToState: (orderData) => {
    const newOrder: Order = {
        ...orderData,
        id: uuidv4(),
        display_id: generateDisplayId(),
        created_at: new Date().toISOString(),
    };
    set(produce((state) => {
        state.orders.unshift(newOrder);
    }));
  },

  addPayment: async (orderId, amount, method) => {
     const order = get().orders.find(o => o.id === orderId);
     if (!order) return;

     const newBalance = order.balance - amount;
     const newStatus = newBalance <= 0 ? 'paid' : order.status;
     const newPayment: Payment = { amount, method, date: new Date().toISOString() };
     
     set(produce((state: OrdersState) => {
        const orderToUpdate = state.orders.find(o => o.id === orderId);
        if(orderToUpdate) {
            orderToUpdate.balance = newBalance;
            orderToUpdate.status = newStatus;
            orderToUpdate.payments.push(newPayment);
        }
    }));
    toast({ title: 'Pago Registrado', description: 'El pago se registró con éxito (Simulado).' });
  },

  approveOrder: async ({ orderId, paymentMethod, paymentDueDate, paymentReference }) => {
    set(produce((state: OrdersState) => {
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
            order.payment_method = paymentMethod;
            order.payment_due_date = paymentDueDate ? paymentDueDate.toISOString() : null;
            order.payment_reference = paymentReference || null;
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
    toast({ title: 'Pedido Aprobado (Simulado)', description: 'El pedido ha sido facturado.' });
  },

  cancelOrder: async (orderId: string) => {
    set(produce((state: OrdersState) => {
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'cancelled';
        }
    }));
    toast({ title: 'Pedido Cancelado (Simulado)' });
  },

  getOrderById: (orderId: string) => {
    return get().orders.find((o) => o.display_id === orderId || o.id === orderId);
  },
}));

// Initialize store data
useOrdersStore.getState().fetchOrders();
