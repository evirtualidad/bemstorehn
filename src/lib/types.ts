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
  payments: any[]; // Define a proper payment type if needed
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';
  payment_reference: string | null;
  status: 'pending-approval' | 'pending-payment' | 'paid' | 'cancelled';
  source: 'pos' | 'online-store';
  delivery_method: 'pickup' | 'delivery' | null;
  payment_due_date: string | null;
}
