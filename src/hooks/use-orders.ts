
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { initialOrders } from '@/lib/orders';
import type { Order, NewOrderData, Payment, Address } from '@/lib/types';
import { useProductsStore } from './use-products';


type OrdersState = {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: () => void;
  createOrder: (order: NewOrderData) => string; 
  addPayment: (orderId: string, amount: number, method: 'efectivo' | 'tarjeta' | 'transferencia') => void;
  approveOrder: (data: { orderId: string, paymentMethod: Order['payment_method'], paymentDueDate?: Date, paymentReference?: string }) => void;
  cancelOrder: (orderId: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
};

export const useOrdersStore = create<OrdersState>()((set, get) => ({
    orders: [],
    isLoading: true,

    fetchOrders: () => {
        set({ orders: initialOrders, isLoading: false });
    },

    createOrder: (orderData) => {
      const newOrder: Order = {
        ...orderData,
        id: uuidv4(),
        display_id: `BEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        created_at: new Date().toISOString(),
      };
      
      initialOrders.unshift(newOrder);
      set({ orders: [...initialOrders] });
      
      return newOrder.id;
    },

    addPayment: (orderId, amount, method) => {
      const order = initialOrders.find(o => o.id === orderId);
      if (!order) return;

      const newBalance = order.balance - amount;
      order.balance = newBalance;
      order.status = newBalance <= 0 ? 'paid' : order.status;
      order.payments.push({ amount, method, date: new Date().toISOString() });

      set({ orders: [...initialOrders] });
      toast({ title: 'Pago Registrado', description: 'El pago se registró con éxito.' });
    },

    approveOrder: ({ orderId, paymentMethod, paymentDueDate, paymentReference }) => {
        const order = initialOrders.find(o => o.id === orderId);
        if (!order) return;

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
        
        // Decrease stock
        const { decreaseStock } = useProductsStore.getState();
        for (const item of order.items) {
          decreaseStock(item.id, item.quantity);
        }

        set({ orders: [...initialOrders] });
        toast({ title: 'Pedido Aprobado', description: 'El pedido ha sido facturado.' });
    },

    cancelOrder: (orderId: string) => {
        const order = initialOrders.find(o => o.id === orderId);
        if (order) {
            // Only return stock if the order was not 'pending-approval' or already 'cancelled'
            if (order.status !== 'pending-approval' && order.status !== 'cancelled') {
                const { increaseStock } = useProductsStore.getState();
                for (const item of order.items) {
                    increaseStock(item.id, item.quantity);
                }
            }
            order.status = 'cancelled';
            set({ orders: [...initialOrders] });
            toast({ title: 'Pedido Cancelado', variant: 'destructive' });
        }
    },

    getOrderById: (orderId: string) => {
      return get().orders.find((o) => o.id === orderId);
    },
}));
