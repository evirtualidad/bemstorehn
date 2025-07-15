
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subDays } from 'date-fns/subDays';
import { addDays } from 'date-fns/addDays';

export interface Payment {
    date: string;
    amount: number;
    method: 'efectivo' | 'tarjeta' | 'transferencia';
}

export interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  total: number;
  balance: number; // Saldo pendiente
  payments: Payment[]; // Historial de pagos
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';
  status: 'paid' | 'pending';
  date: string;
  paymentDueDate?: string;
}

const now = new Date();

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customer: { name: 'Olivia Martin', phone: '555-0101' },
    items: [{ id: 'prod_001', name: 'Glow Serum', price: 35.00, quantity: 1, image: 'https://placehold.co/400x400.png' }],
    total: 35.00,
    balance: 0,
    payments: [{ date: subDays(now, 1).toISOString(), amount: 35.00, method: 'tarjeta' }],
    paymentMethod: 'tarjeta',
    status: 'paid',
    date: subDays(now, 1).toISOString(),
  },
  {
    id: 'ORD-002',
    customer: { name: 'Jackson Lee', phone: '555-0102' },
    items: [{ id: 'prod_004', name: 'Luminous Foundation', price: 52.00, quantity: 2, image: 'https://placehold.co/400x400.png' }],
    total: 104.00,
    balance: 104.00,
    payments: [],
    paymentMethod: 'credito',
    status: 'pending',
    date: subDays(now, 2).toISOString(),
    paymentDueDate: addDays(subDays(now, 2), 30).toISOString(),
  },
  {
    id: 'ORD-003',
    customer: { name: 'Isabella Nguyen', phone: '555-0103' },
    items: [{ id: 'prod_008', name: 'Waterproof Mascara', price: 26.00, quantity: 1, image: 'https://placehold.co/400x400.png' }],
    total: 26.00,
    balance: 0,
    payments: [{ date: subDays(now, 5).toISOString(), amount: 26.00, method: 'efectivo' }],
    paymentMethod: 'efectivo',
    status: 'paid',
    date: subDays(now, 5).toISOString(),
  },
  {
    id: 'ORD-004',
    customer: { name: 'William Kim', phone: '555-0104' },
    items: [
        { id: 'prod_007', name: 'Purifying Clay Mask', price: 28.00, quantity: 1, image: 'https://placehold.co/400x400.png' },
        { id: 'prod_010', name: 'Eyeshadow Palette', price: 39.00, quantity: 1, image: 'https://placehold.co/400x400.png' }
    ],
    total: 67.00,
    balance: 0,
    payments: [{ date: subDays(now, 8).toISOString(), amount: 67.00, method: 'transferencia' }],
    paymentMethod: 'transferencia',
    status: 'paid',
    date: subDays(now, 8).toISOString(),
  },
  {
    id: 'ORD-005',
    customer: { name: 'Sophia Rodriguez', phone: '555-0105' },
    items: [{ id: 'prod_003', name: 'Velvet Matte Lipstick', price: 24.00, quantity: 3, image: 'https://placehold.co/400x400.png' }],
    total: 72.00,
    balance: 22.00,
    payments: [{ date: subDays(now, 10).toISOString(), amount: 50.00, method: 'efectivo' }],
    paymentMethod: 'credito',
    status: 'pending',
    date: subDays(now, 10).toISOString(),
    paymentDueDate: addDays(now, 5).toISOString(),
  },
   {
    id: 'ORD-006',
    customer: { name: 'Liam Johnson', phone: '555-0106' },
    items: [{ id: 'prod_011', name: 'Keratin Smooth Shampoo', price: 28.00, quantity: 1, image: 'https://placehold.co/400x400.png' }],
    total: 28.00,
    balance: 28.00,
    payments: [],
    paymentMethod: 'credito',
    status: 'pending',
    date: subDays(now, 15).toISOString(),
    paymentDueDate: subDays(now, 2).toISOString(), // Vencida
  },
  {
    id: 'ORD-007',
    customer: { name: 'Noah Williams', phone: '555-0107' },
    items: [{ id: 'prod_002', name: 'Hydra-Boost Moisturizer', price: 38.50, quantity: 1, image: 'https://placehold.co/400x400.png' }],
    total: 38.50,
    balance: 0,
    payments: [{ date: subDays(now, 25).toISOString(), amount: 38.50, method: 'efectivo' }],
    paymentMethod: 'efectivo',
    status: 'paid',
    date: subDays(now, 25).toISOString(),
  },
  {
    id: 'ORD-008',
    customer: { name: 'Emma Brown', phone: '555-0108' },
    items: [{ id: 'prod_005', name: 'Argan Oil Hair Repair', price: 30.00, quantity: 1, image: 'https://placehold.co/400x400.png' }],
    total: 30.00,
    balance: 0,
    payments: [{ date: subDays(now, 35).toISOString(), amount: 30.00, method: 'tarjeta' }],
    paymentMethod: 'tarjeta',
    status: 'paid',
    date: subDays(now, 35).toISOString(),
  },
];


type OrdersState = {
  orders: Order[];
  addOrder: (order: Omit<Order, 'balance' | 'payments' | 'status'>) => void;
  addPayment: (orderId: string, amount: number, method: 'efectivo' | 'tarjeta' | 'transferencia') => void;
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
              phone: order.customer.phone || 'N/A'
            },
            balance: order.paymentMethod === 'credito' ? order.total : 0,
            status: order.paymentMethod === 'credito' ? 'pending' : 'paid',
            payments: order.paymentMethod !== 'credito' ? [{
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
                status: newBalance <= 0 ? 'paid' : 'pending',
              };
            }
            return o;
          }),
        }));
      },
    }),
    {
      name: 'orders-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

    
