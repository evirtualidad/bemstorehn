
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { initialOrders } from '@/lib/orders';

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
  id: string; 
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

const generateDisplayId = () => `BEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

type OrdersState = {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: () => Promise<void>;
  createOrder: (order: NewOrderData) => Promise<string | null>; 
  addPayment: (orderId: string, amount: number, method: 'efectivo' | 'tarjeta' | 'transferencia') => Promise<void>;
  approveOrder: (data: { orderId: string, paymentMethod: Order['payment_method'], paymentDueDate?: Date, paymentReference?: string }) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
};

export const useOrdersStore = create<OrdersState>()((set, get) => ({
    orders: [],
    isLoading: true,

    fetchOrders: async () => {
        set({ isLoading: true });
        if (!isSupabaseConfigured) {
          set({ orders: initialOrders, isLoading: false });
          return;
        }
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
         if (error) {
            toast({ title: 'Error al cargar pedidos', description: error.message, variant: 'destructive'});
            set({ orders: [], isLoading: false });
        } else {
            set({ orders: data as any[], isLoading: false });
        }
    },

    createOrder: async (orderData) => {
        const newOrder: Order = {
          ...orderData,
          id: uuidv4(),
          display_id: generateDisplayId(),
          created_at: new Date().toISOString(),
        };
        
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('orders').insert([newOrder]);
            if (error) {
                toast({ title: 'Error al crear el pedido', description: error.message, variant: 'destructive'});
                return null;
            }
        }
        
        set(produce(state => {
            state.orders.unshift(newOrder);
        }));

        return newOrder.id;
    },

    addPayment: async (orderId, amount, method) => {
      const order = get().orders.find(o => o.id === orderId);
      if (!order) return;

      const newBalance = order.balance - amount;
      const newStatus = newBalance <= 0 ? 'paid' : order.status;
      const newPayment: Payment = { amount, method, date: new Date().toISOString() };
      const updatedPayments = [...order.payments, newPayment];

      set(produce(state => {
          const orderToUpdate = state.orders.find(o => o.id === orderId);
          if (orderToUpdate) {
              orderToUpdate.balance = newBalance;
              orderToUpdate.status = newStatus;
              orderToUpdate.payments = updatedPayments;
          }
      }));
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

        set(produce(state => {
            const orderToUpdate = state.orders.find(o => o.id === orderId);
            if (orderToUpdate) {
                Object.assign(orderToUpdate, updateData);
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
      return get().orders.find((o) => o.id === orderId);
    },
}));
