
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Payment {
    date: string;
    amount: number;
    method: 'efectivo' | 'tarjeta' | 'transferencia';
}

export interface Address {
  department: string;
  municipality: string;
  colony?: string;
  exactAddress: string;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    address?: Address;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  total: number;
  shippingCost?: number;
  balance: number; 
  payments: Payment[]; 
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';
  paymentReference?: string;
  status: 'pending-approval' | 'pending-payment' | 'paid' | 'cancelled';
  source: 'pos' | 'online-store';
  deliveryMethod?: 'pickup' | 'delivery';
  date: string;
  paymentDueDate?: string;
}

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customer: { name: 'Olivia Martin', phone: '555-0101' },
    items: [{ id: 'prod_001', name: 'Glow Serum', price: 35.00, quantity: 1, image: 'https://placehold.co/400x400.png' }],
    total: 35.00,
    balance: 0,
    payments: [{ date: '2024-07-15T12:00:00.000Z', amount: 35.00, method: 'tarjeta' }],
    paymentMethod: 'tarjeta',
    status: 'paid',
    source: 'pos',
    date: '2024-07-15T12:00:00.000Z',
    deliveryMethod: 'pickup',
  },
  {
    id: 'ORD-002',
    customer: { name: 'Jackson Lee', phone: '555-0102' },
    items: [{ id: 'prod_004', name: 'Luminous Foundation', price: 52.00, quantity: 2, image: 'https://placehold.co/400x400.png' }],
    total: 104.00,
    balance: 104.00,
    payments: [],
    paymentMethod: 'credito',
    status: 'pending-payment',
    source: 'pos',
    date: '2024-07-14T12:00:00.000Z',
    paymentDueDate: '2024-08-13T12:00:00.000Z',
    deliveryMethod: 'pickup',
  },
  {
    id: 'ORD-003',
    customer: { name: 'Isabella Nguyen', phone: '555-0103' },
    items: [{ id: 'prod_008', name: 'Waterproof Mascara', price: 26.00, quantity: 1, image: 'https://placehold.co/400x400.png' }],
    total: 26.00,
    balance: 0,
    payments: [{ date: '2024-07-11T12:00:00.000Z', amount: 26.00, method: 'efectivo' }],
    paymentMethod: 'efectivo',
    status: 'paid',
    source: 'pos',
    date: '2024-07-11T12:00:00.000Z',
     deliveryMethod: 'pickup',
  },
   {
    id: 'ORD-009-ONLINE',
    customer: { 
      name: 'Mason Garcia', 
      phone: '555-0109',
    },
    items: [{ id: 'prod_006', name: 'Volumizing Dry Shampoo', price: 18.00, quantity: 2, image: 'https://placehold.co/400x400.png' }],
    total: 36.00,
    balance: 36.00,
    payments: [],
    paymentMethod: 'tarjeta', // Placeholder
    status: 'pending-approval',
    source: 'online-store',
    deliveryMethod: 'pickup',
    date: '2024-07-15T14:00:00.000Z',
  },
  {
    id: 'ORD-005',
    customer: { name: 'Sophia Rodriguez', phone: '555-0105' },
    items: [{ id: 'prod_003', name: 'Velvet Matte Lipstick', price: 24.00, quantity: 3, image: 'https://placehold.co/400x400.png' }],
    total: 72.00,
    balance: 22.00,
    payments: [{ date: '2024-07-06T12:00:00.000Z', amount: 50.00, method: 'efectivo' }],
    paymentMethod: 'credito',
    status: 'pending-payment',
    source: 'pos',
    date: '2024-07-06T12:00:00.000Z',
    paymentDueDate: '2024-07-21T12:00:00.000Z',
     deliveryMethod: 'pickup',
  },
   {
    id: 'ORD-006',
    customer: { name: 'Liam Johnson', phone: '555-0106' },
    items: [{ id: 'prod_011', name: 'Keratin Smooth Shampoo', price: 28.00, quantity: 1, image: 'https://placehold.co/400x400.png' }],
    total: 28.00,
    balance: 28.00,
    payments: [],
    paymentMethod: 'credito',
    status: 'pending-payment',
    source: 'pos',
    date: '2024-07-01T12:00:00.000Z',
    paymentDueDate: '2024-07-14T12:00:00.000Z', // Vencida
    deliveryMethod: 'pickup',
  },
];


type OrdersState = {
  orders: Order[];
  addOrder: (order: Omit<Order, 'balance' | 'payments' | 'status'> & { status: Order['status'] }) => void;
  addPayment: (orderId: string, amount: number, method: 'efectivo' | 'tarjeta' | 'transferencia') => void;
  approveOrder: (data: { orderId: string, paymentMethod: Order['paymentMethod'], paymentDueDate?: Date, paymentReference?: string }) => void;
  cancelOrder: (orderId: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
};

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: mockOrders,
      addOrder: (order) => {
        const newOrder: Order = {
            ...order,
            customer: {
              name: order.customer.name || 'Consumidor Final',
              phone: order.customer.phone || 'N/A',
              address: order.customer.address,
            },
            balance: (order.status === 'pending-payment' || order.status === 'pending-approval') ? order.total : 0,
            status: order.status,
            payments: order.status === 'paid' ? [{
                amount: order.total,
                date: new Date().toISOString(),
                method: order.paymentMethod as 'efectivo' | 'tarjeta' | 'transferencia',
            }] : [],
        };
        set((state) => ({ orders: [newOrder, ...state.orders] }));
      },
      addPayment: (orderId, amount, method) => {
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === orderId) {
              const newBalance = o.balance - amount;
              const newPayment: Payment = {
                amount,
                method,
                date: new Date().toISOString(),
              };
              return { 
                ...o, 
                balance: newBalance,
                payments: [...o.payments, newPayment],
                status: newBalance <= 0 ? 'paid' : 'pending-payment',
              };
            }
            return o;
          }),
        }));
      },
      approveOrder: ({ orderId, paymentMethod, paymentDueDate, paymentReference }) => {
        set((state) => ({
            orders: state.orders.map((o) => {
                if (o.id === orderId && o.status === 'pending-approval') {
                    const isCredit = paymentMethod === 'credito';
                    const isPaid = ['tarjeta', 'efectivo', 'transferencia'].includes(paymentMethod);
                    
                    let status: Order['status'] = 'pending-approval';
                    if (isCredit) status = 'pending-payment';
                    if (isPaid) status = 'paid';

                    return {
                        ...o,
                        paymentMethod: paymentMethod,
                        paymentDueDate: paymentDueDate ? paymentDueDate.toISOString() : o.paymentDueDate,
                        paymentReference: paymentReference || o.paymentReference,
                        status: status,
                        balance: isCredit ? o.total : 0,
                        payments: isPaid ? [{
                            amount: o.total,
                            date: new Date().toISOString(),
                            method: paymentMethod as 'efectivo' | 'tarjeta' | 'transferencia'
                        }] : []
                    };
                }
                return o;
            })
        }))
      },
      cancelOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === orderId) {
              return { ...o, status: 'cancelled' };
            }
            return o;
          })
        }));
      },
      getOrderById: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        return order;
      },
    }),
    {
      name: 'orders-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
