
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { subDays, subHours } from 'date-fns';

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
  id: string; // UUID
  display_id: string; // User-friendly ID
  created_at: any; // ISO string
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

const initialOrders: Order[] = [
    {
        id: uuidv4(),
        display_id: 'AB-123456',
        created_at: subDays(new Date(), 1).toISOString(),
        user_id: 'user_1',
        customer_id: 'cust_1',
        customer_name: 'Ana García',
        customer_phone: '9988-7766',
        customer_address: { department: 'Francisco Morazán', municipality: 'Distrito Central', colony: 'Col. Kennedy', exactAddress: 'Bloque 5, Casa 20' },
        items: [
            { id: 'prod_001', name: 'Glow Serum', price: 35, quantity: 1, image: 'https://placehold.co/100x100' },
            { id: 'prod_003', name: 'Velvet Matte Lipstick', price: 24, quantity: 2, image: 'https://placehold.co/100x100' },
        ],
        total: 103, // 35 + 48 + 20 shipping
        shipping_cost: 20,
        balance: 0,
        payments: [{ date: subDays(new Date(), 1).toISOString(), amount: 103, method: 'tarjeta' }],
        payment_method: 'tarjeta',
        payment_reference: 'REF-CARD-001',
        status: 'paid',
        source: 'online-store',
        delivery_method: 'delivery',
        payment_due_date: null,
    },
    {
        id: uuidv4(),
        display_id: 'CD-789012',
        created_at: subDays(new Date(), 2).toISOString(),
        user_id: 'user_2',
        customer_id: 'cust_2',
        customer_name: 'Carlos Rivera',
        customer_phone: '3322-1100',
        customer_address: null,
        items: [
            { id: 'prod_004', name: 'Luminous Foundation', price: 52, quantity: 1, image: 'https://placehold.co/100x100' },
        ],
        total: 52,
        shipping_cost: 0,
        balance: 52,
        payments: [],
        payment_method: 'credito',
        payment_reference: null,
        status: 'pending-payment',
        source: 'pos',
        delivery_method: 'pickup',
        payment_due_date: subDays(new Date(), -15).toISOString(),
    },
    {
        id: uuidv4(),
        display_id: 'EF-345678',
        created_at: subHours(new Date(), 4).toISOString(),
        user_id: null,
        customer_id: null,
        customer_name: 'Invitado',
        customer_phone: '9876-5432',
        customer_address: { department: 'Francisco Morazán', municipality: 'Distrito Central', colony: 'Col. Miraflores', exactAddress: 'Frente a la pulpería' },
        items: [
            { id: 'prod_007', name: 'Purifying Clay Mask', price: 28, quantity: 1, image: 'https://placehold.co/100x100' },
        ],
        total: 28,
        shipping_cost: 0,
        balance: 28,
        payments: [],
        payment_method: 'transferencia',
        payment_reference: 'REF-XFER-003',
        status: 'pending-approval',
        source: 'online-store',
        delivery_method: 'delivery',
        payment_due_date: null,
    }
];

type OrdersState = {
  orders: Order[];
  isLoading: boolean;
  addOrderToState: (order: NewOrderData) => Promise<string>; // Returns the new order ID
  addPayment: (orderId: string, amount: number, method: 'efectivo' | 'tarjeta' | 'transferencia') => Promise<void>;
  approveOrder: (data: { orderId: string, paymentMethod: Order['payment_method'], paymentDueDate?: Date, paymentReference?: string }) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
};

const generateDisplayId = () => {
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${random}-${timestamp}`;
};

export const useOrdersStore = create<OrdersState>()(
    (set, get) => ({
      orders: initialOrders,
      isLoading: false,

      addOrderToState: async (orderData) => {
        const id = uuidv4();
        const display_id = generateDisplayId();
        const newOrder: Order = {
            ...orderData,
            id,
            display_id,
            created_at: new Date().toISOString(),
        };
        
        set(produce(state => {
            state.orders.unshift(newOrder);
        }));

        return id;
      },

      addPayment: async (orderId, amount, method) => {
        set(produce(state => {
            const order = state.orders.find(o => o.id === orderId);
            if (order) {
                const newBalance = order.balance - amount;
                order.balance = newBalance;
                order.status = newBalance <= 0 ? 'paid' : order.status;
                order.payments.push({ amount, method, date: new Date().toISOString() });
            }
        }));
        toast({ title: 'Pago Registrado', description: 'El pago se registró con éxito.' });
      },

      approveOrder: async ({ orderId, paymentMethod, paymentDueDate, paymentReference }) => {
        set(produce(state => {
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
        toast({ title: 'Pedido Aprobado', description: 'El pedido ha sido facturado.' });
      },

      cancelOrder: async (orderId: string) => {
        set(produce(state => {
            const order = state.orders.find(o => o.id === orderId);
            if (order) {
                order.status = 'cancelled';
            }
        }));
        toast({ title: 'Pedido Cancelado', variant: 'destructive' });
      },

      getOrderById: (orderId: string) => {
        return get().orders.find((o) => o.display_id === orderId || o.id === orderId);
      },
    })
);
