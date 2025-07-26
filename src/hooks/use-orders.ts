
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { supabase } from '@/lib/supabase';
import type { Order, NewOrderData } from '@/lib/types';
import { useProductsStore } from './use-products';
import { createOnlineOrder } from '@/ai/flows/create-order-flow';
import { persist, createJSONStorage } from 'zustand/middleware';

type OrdersState = {
  orders: Order[];
  isLoading: boolean;
  createOrder: (order: NewOrderData) => Promise<Order | null>; 
  addPayment: (orderId: string, amount: number, method: 'efectivo' | 'tarjeta' | 'transferencia', reference?: string) => Promise<void>;
  approveOrder: (data: { orderId: string, paymentMethod: Order['payment_method'], paymentDueDate?: Date, paymentReference?: string }) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
};

export const useOrdersStore = create<OrdersState>()(
    persist(
    (set, get) => ({
        orders: [],
        isLoading: true,

        createOrder: async (orderData) => {
            if (orderData.source === 'online-store') {
                try {
                    const result = await createOnlineOrder(orderData);
                    if (result && result.success && result.order) {
                        return result.order;
                    }
                    throw new Error(result?.error || 'Unknown error from order creation flow');
                } catch (e: any) {
                    toast({ title: 'Error al crear pedido', description: e.message || 'An unexpected error occurred', variant: 'destructive' });
                    return null;
                }
            } else { // POS orders
                const { data: lastOrder, error: lastOrderError } = await supabase
                  .from('orders')
                  .select('display_id')
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();
                  
                let nextId = 1;
                if (lastOrder && !lastOrderError) {
                    const numericPart = lastOrder.display_id.split('-')[1];
                    if (numericPart) nextId = parseInt(numericPart) + 1;
                }
                const display_id = `ORD-${String(nextId).padStart(5, '0')}`;
                
                const finalOrderData = { ...orderData, display_id };
                 const { data: newOrder, error } = await supabase
                    .from('orders')
                    .insert(finalOrderData)
                    .select()
                    .single();

                if (error) {
                    toast({ title: 'Error al crear pedido (POS)', description: error.message, variant: 'destructive' });
                    return null;
                }
                
                const { decreaseStock } = useProductsStore.getState();
                for (const item of newOrder.items) {
                    await decreaseStock(item.id, item.quantity);
                }

                return newOrder;
            }
        },

        addPayment: async (orderId, amount, method, reference) => {
            const order = get().orders.find(o => o.id === orderId);
            if (!order) return;

            const newBalance = order.balance - amount;
            const newStatus = newBalance <= 0 ? 'paid' : order.status;
            const newPayment = { amount, method, date: new Date().toISOString(), reference: reference || undefined };
            const updatedPayments = [...order.payments, newPayment];
            
            const { error } = await supabase
                .from('orders')
                .update({ balance: newBalance, status: newStatus, payments: updatedPayments })
                .eq('id', orderId);

            if (error) {
                toast({ title: 'Error al registrar pago', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Pago Registrado' });
            }
        },

        approveOrder: async ({ orderId, paymentMethod, paymentDueDate, paymentReference }) => {
            const order = get().orders.find(o => o.id === orderId);
            if (!order) return;
            
            let updateData: Partial<Order> = {
                payment_method: paymentMethod,
                payment_due_date: paymentDueDate ? paymentDueDate.toISOString() : null,
                payment_reference: paymentReference || null,
            };
            
            if (paymentMethod === 'credito') {
                updateData.status = 'pending-payment';
                updateData.balance = order.total;
                updateData.payments = [];
            } else {
                updateData.status = 'paid';
                updateData.balance = 0;
                updateData.payments = [{ amount: order.total, date: new Date().toISOString(), method: paymentMethod, reference: paymentReference }];
            }

            const { error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            if (error) {
                toast({ title: 'Error al aprobar pedido', description: error.message, variant: 'destructive' });
            } else {
                if (order.status === 'pending-approval') {
                    const { decreaseStock } = useProductsStore.getState();
                    for (const item of order.items) {
                        await decreaseStock(item.id, item.quantity);
                    }
                }
                toast({ title: 'Pedido Aprobado' });
            }
        },

        cancelOrder: async (orderId: string) => {
            const orderToCancel = get().orders.find(o => o.id === orderId);
            if (!orderToCancel) return;
            
            const shouldReturnStock = orderToCancel.status !== 'pending-approval' && orderToCancel.status !== 'cancelled';
            
            const { error } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', orderId);
            
            if (error) {
                toast({ title: 'Error al cancelar pedido', description: error.message, variant: 'destructive' });
            } else {
                 if (shouldReturnStock) {
                    const { increaseStock } = useProductsStore.getState();
                    for (const item of orderToCancel.items) {
                        await increaseStock(item.id, item.quantity);
                    }
                }
                toast({ title: 'Pedido Cancelado', variant: 'destructive' });
            }
        },

        getOrderById: (orderId: string) => {
          return get().orders.find((o) => o.id === orderId);
        },
    }),
    {
        name: 'bem-orders-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ orders: state.orders, isLoading: state.isLoading }),
        onRehydrateStorage: () => (state) => {
          if (state) state.isLoading = !state.orders.length;
        }
    }
    )
);

// Subscribe to real-time changes
if (typeof window !== 'undefined') {
  supabase
    .channel('orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      const { setState } = useOrdersStore;
      
      if (payload.eventType === 'INSERT') {
        setState(produce(draft => {
            draft.orders.unshift(payload.new as Order);
            draft.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }));
      }

      if (payload.eventType === 'UPDATE') {
        setState(produce(draft => {
            const index = draft.orders.findIndex(o => o.id === payload.new.id);
            if (index !== -1) draft.orders[index] = payload.new as Order;
        }));
      }

      if (payload.eventType === 'DELETE') {
        setState(produce(draft => {
            draft.orders = draft.orders.filter(o => o.id !== payload.old.id);
        }));
      }
    })
    .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
            if (error) {
                toast({ title: 'Error al sincronizar pedidos', description: error.message, variant: 'destructive' });
            } else {
                useOrdersStore.setState({ orders: data, isLoading: false });
            }
        }
    });
}
