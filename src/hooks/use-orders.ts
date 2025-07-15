
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subDays, addDays } from 'date-fns';

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
  }>;
  total: number;
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
    items: [{ id: 'prod_001', name: 'Glow Serum', price: 35.00, quantity: 1 }],
    total: 35.00,
    paymentMethod: 'tarjeta',
    status: 'paid',
    date: subDays(now, 1).toISOString(),
  },
  {
    id: 'ORD-002',
    customer: { name: 'Jackson Lee', phone: '555-0102' },
    items: [{ id: 'prod_004', name: 'Luminous Foundation', price: 52.00, quantity: 2 }],
    total: 104.00,
    paymentMethod: 'credito',
    status: 'pending',
    date: subDays(now, 2).toISOString(),
    paymentDueDate: addDays(subDays(now, 2), 30).toISOString(),
  },
  {
    id: 'ORD-003',
    customer: { name: 'Isabella Nguyen', phone: '555-0103' },
    items: [{ id: 'prod_008', name: 'Waterproof Mascara', price: 26.00, quantity: 1 }],
    total: 26.00,
    paymentMethod: 'efectivo',
    status: 'paid',
    date: subDays(now, 5).toISOString(),
  },
  {
    id: 'ORD-004',
    customer: { name: 'William Kim', phone: '555-0104' },
    items: [
        { id: 'prod_007', name: 'Purifying Clay Mask', price: 28.00, quantity: 1 },
        { id: 'prod_010', name: 'Eyeshadow Palette', price: 39.00, quantity: 1 }
    ],
    total: 67.00,
    paymentMethod: 'transferencia',
    status: 'paid',
    date: subDays(now, 8).toISOString(),
  },
  {
    id: 'ORD-005',
    customer: { name: 'Sophia Rodriguez', phone: '555-0105' },
    items: [{ id: 'prod_003', name: 'Velvet Matte Lipstick', price: 24.00, quantity: 3 }],
    total: 72.00,
    paymentMethod: 'credito',
    status: 'pending',
    date: subDays(now, 10).toISOString(),
    paymentDueDate: addDays(now, 5).toISOString(),
  },
   {
    id: 'ORD-006',
    customer: { name: 'Liam Johnson', phone: '555-0106' },
    items: [{ id: 'prod_011', name: 'Keratin Smooth Shampoo', price: 28.00, quantity: 1 }],
    total: 28.00,
    paymentMethod: 'credito',
    status: 'pending',
    date: subDays(now, 15).toISOString(),
    paymentDueDate: subDays(now, 2).toISOString(), // Vencida
  },
  {
    id: 'ORD-007',
    customer: { name: 'Noah Williams', phone: '555-0107' },
    items: [{ id: 'prod_002', name: 'Hydra-Boost Moisturizer', price: 38.50, quantity: 1 }],
    total: 38.50,
    paymentMethod: 'efectivo',
    status: 'paid',
    date: subDays(now, 25).toISOString(),
  },
  {
    id: 'ORD-008',
    customer: { name: 'Emma Brown', phone: '555-0108' },
    items: [{ id: 'prod_005', name: 'Argan Oil Hair Repair', price: 30.00, quantity: 1 }],
    total: 30.00,
    paymentMethod: 'tarjeta',
    status: 'paid',
    date: subDays(now, 35).toISOString(),
  },
];


type OrdersState = {
  orders: Order[];
  addOrder: (order: Order) => void;
  markOrderAsPaid: (orderId: string) => void;
};

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: mockOrders,
      addOrder: (order) => {
        set((state) => ({ orders: [order, ...state.orders] }));
      },
      markOrderAsPaid: (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'paid' } : o
          ),
        }));
      },
    }),
    {
      name: 'orders-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
