
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { supabaseClient } from '@/lib/supabase';

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
  addPayment: (orderId: string, amount: number, method: 'efectivo' | 'tarjeta' | 'transferencia') => Promise<void>;
  approveOrder: (data: { orderId: string, paymentMethod: Order['payment_method'], paymentDueDate?: Date, paymentReference?: string }) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
};

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  isLoading: false,

  fetchOrders: async () => {
    set({ isLoading: true });
    const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        set({ isLoading: false });
        toast({ title: 'Error al cargar pedidos', description: error.message, variant: 'destructive' });
    } else {
        set({ orders: data as Order[], isLoading: false });
    }
  },
  
  addPayment: async (orderId, amount, method) => {
     const order = get().orders.find(o => o.id === orderId);
     if (!order) return;

     const newBalance = order.balance - amount;
     const newStatus = newBalance <= 0 ? 'paid' : order.status;
     const newPayment: Payment = { amount, method, date: new Date().toISOString() };
     const updatedPayments = [...order.payments, newPayment];
     
     const { data, error } = await supabaseClient
        .from('orders')
        .update({
            balance: newBalance,
            status: newStatus,
            payments: updatedPayments,
        })
        .eq('id', orderId)
        .select()
        .single();
    
    if (error) {
        toast({ title: 'Error', description: 'No se pudo registrar el pago.', variant: 'destructive' });
    } else {
        set(produce((state: OrdersState) => {
            const index = state.orders.findIndex(o => o.id === orderId);
            if (index !== -1) {
                state.orders[index] = data as Order;
            }
        }));
        toast({ title: 'Pago Registrado', description: 'El pago se registró con éxito.' });
    }
  },

  approveOrder: async ({ orderId, paymentMethod, paymentDueDate, paymentReference }) => {
    const order = get().orders.find(o => o.id === orderId);
    if (!order) return;

    let updateData: Partial<Order> = {
        payment_method: paymentMethod,
        payment_due_date: paymentDueDate ? paymentDueDate.toISOString() : order.payment_due_date,
        payment_reference: paymentReference || order.payment_reference,
    };
    
    if (paymentMethod === 'credito') {
        updateData.status = 'pending-payment';
        updateData.balance = order.total;
    } else {
        updateData.status = 'paid';
        updateData.balance = 0;
        updateData.payments = [{ amount: order.total, date: new Date().toISOString(), method: paymentMethod }];
    }

    const { data, error } = await supabaseClient
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

    if (error) {
        toast({ title: 'Error', description: 'No se pudo aprobar el pedido.', variant: 'destructive' });
    } else {
        set(produce((state: OrdersState) => {
            const index = state.orders.findIndex(o => o.id === orderId);
            if (index !== -1) {
                state.orders[index] = data as Order;
            }
        }));
        toast({ title: 'Pedido Aprobado', description: 'El pedido ha sido facturado.' });
    }
  },

  cancelOrder: async (orderId: string) => {
    const { data, error } = await supabaseClient
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .select()
        .single();

    if (error) {
        toast({ title: 'Error', description: 'No se pudo cancelar el pedido.', variant: 'destructive' });
    } else {
        set(produce((state: OrdersState) => {
            const index = state.orders.findIndex(o => o.id === orderId);
            if (index !== -1) {
                state.orders[index] = data as Order;
            }
        }));
        toast({ title: 'Pedido Cancelado' });
    }
  },

  getOrderById: (orderId: string) => {
    return get().orders.find((o) => o.display_id === orderId || o.id === orderId);
  },
}));

// Initialize store data
useOrdersStore.getState().fetchOrders();
