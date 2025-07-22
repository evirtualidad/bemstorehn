
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { supabase } from '@/lib/supabase';
import type { Order, NewOrderData } from '@/lib/types';
import { useProductsStore } from './use-products';

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

export const useOrdersStore = create<OrdersState>()(
    (set, get) => ({
        orders: [],
        isLoading: true,

        fetchOrders: async () => {
            set({ isLoading: true });
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                toast({ title: 'Error al cargar pedidos', description: error.message, variant: 'destructive' });
                set({ orders: [], isLoading: false });
            } else {
                set({ orders: data, isLoading: false });
            }
        },

        createOrder: async (orderData) => {
            // This now calls a Supabase Edge Function to handle the entire process securely.
            const { data, error } = await supabase.functions.invoke('create-order', {
                body: { orderData },
            });

            if (error) {
                toast({ title: 'Error al crear pedido', description: `Error del servidor: ${error.message}`, variant: 'destructive' });
                return null;
            }

            if (data.error) {
                toast({ title: 'Error al procesar pedido', description: data.error, variant: 'destructive' });
                return null;
            }
            
            const newOrder = data.order;
            
            // The function handles stock deduction, so we just need to update the client state for products
            const { fetchProducts } = useProductsStore.getState();
            fetchProducts();

            set(produce((state: OrdersState) => {
                state.orders.unshift(newOrder as Order);
            }));
            
            return newOrder.id;
        },

        addPayment: async (orderId, amount, method) => {
            const order = get().orders.find(o => o.id === orderId);
            if (!order) return;

            const newBalance = order.balance - amount;
            const newStatus = newBalance <= 0 ? 'paid' : order.status;
            const newPayment = { amount, method, date: new Date().toISOString() };
            const updatedPayments = [...order.payments, newPayment];
            
            const { error } = await supabase
                .from('orders')
                .update({ balance: newBalance, status: newStatus, payments: updatedPayments })
                .eq('id', orderId);

            if (error) {
                toast({ title: 'Error al registrar pago', description: error.message, variant: 'destructive' });
            } else {
                set(produce((state: OrdersState) => {
                    const orderToUpdate = state.orders.find(o => o.id === orderId);
                    if (orderToUpdate) {
                        orderToUpdate.balance = newBalance;
                        orderToUpdate.status = newStatus;
                        orderToUpdate.payments = updatedPayments;
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
                payment_due_date: paymentDueDate ? paymentDueDate.toISOString() : null,
                payment_reference: paymentReference || null,
            };

            // This logic is simplified because the 'create-order' function now handles initial stock deduction for 'paid' POS orders.
            // This function is primarily for 'pending-approval' orders from the online store.
            if (order.status === 'pending-approval') {
                const { decreaseStock } = useProductsStore.getState();
                for (const item of order.items) {
                    await decreaseStock(item.id, item.quantity);
                }
            }
            
            if (paymentMethod === 'credito') {
                updateData.status = 'pending-payment';
                updateData.balance = order.total;
                 updateData.payments = [];
            } else {
                updateData.status = 'paid';
                updateData.balance = 0;
                updateData.payments = [{ amount: order.total, date: new Date().toISOString(), method: paymentMethod }];
            }

            const { data: updatedOrder, error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId)
                .select()
                .single();

            if (error) {
                toast({ title: 'Error al aprobar pedido', description: error.message, variant: 'destructive' });
            } else {
                set(produce((state: OrdersState) => {
                    const orderToUpdate = state.orders.find(o => o.id === orderId);
                    if (orderToUpdate) {
                        Object.assign(orderToUpdate, updatedOrder);
                    }
                }));

                toast({ title: 'Pedido Aprobado', description: 'El pedido ha sido facturado.' });
            }
        },

        cancelOrder: async (orderId: string) => {
            const orderToCancel = get().orders.find(o => o.id === orderId);
            if (!orderToCancel) return;
            
            const { error } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', orderId);
            
            if (error) {
                toast({ title: 'Error al cancelar pedido', description: error.message, variant: 'destructive' });
            } else {
                 if (orderToCancel.status !== 'pending-approval' && orderToCancel.status !== 'cancelled') {
                    const { increaseStock } = useProductsStore.getState();
                    for (const item of orderToCancel.items) {
                        await increaseStock(item.id, item.quantity);
                    }
                }
                set(produce((state: OrdersState) => {
                    const order = state.orders.find(o => o.id === orderId);
                    if (order) {
                        order.status = 'cancelled';
                    }
                }));
                toast({ title: 'Pedido Cancelado', variant: 'destructive' });
            }
        },

        getOrderById: (orderId: string) => {
          return get().orders.find((o) => o.id === orderId);
        },
    })
);

