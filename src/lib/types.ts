
import type { User as SupabaseUser } from '@supabase/supabase-js'

export type Product = {
  id: string;
  created_at?: string;
  name: string;
  image: string;
  aiHint?: string;
  price: number;
  original_price?: number;
  description: string;
  category: string; 
  stock: number;
  featured?: boolean;
}

export type Category = {
  id: string; 
  name: string; 
  label: string; 
}

export type Banner = {
  id: string;
  title: string;
  description: string;
  image: string;
  aiHint?: string;
}

export type CartItem = {
  quantity: number;
} & Product;

export type Address = {
  department: string;
  municipality: string;
  colony?: string;
  exactAddress: string;
}

export type Payment = {
    amount: number;
    date: string;
    method: Order['payment_method'];
    reference?: string;
}

export type Order = {
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

export type Customer = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  address: Address | null;
  total_spent: number;
  order_count: number;
}

export type UserRole = 'admin' | 'cajero';

export type User = SupabaseUser & {
    role: UserRole;
}
