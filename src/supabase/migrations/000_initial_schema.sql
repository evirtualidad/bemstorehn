-- Enable the UUID extension if it's not already enabled.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Create Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL
);

-- Create Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    stock INT NOT NULL,
    image TEXT,
    ai_hint TEXT,
    featured BOOLEAN DEFAULT false,
    category_id UUID REFERENCES public.categories(id)
);

-- Create Banners table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    ai_hint TEXT
);

-- Create Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    address JSONB,
    total_spent NUMERIC DEFAULT 0,
    order_count INT DEFAULT 0
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_id TEXT UNIQUE NOT NULL DEFAULT concat('ORD-', substr(uuid_generate_v4()::text, 1, 6)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address JSONB,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    shipping_cost NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    payments JSONB DEFAULT '[]'::jsonb,
    payment_method TEXT NOT NULL,
    payment_reference TEXT,
    payment_due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending-approval',
    source TEXT NOT NULL,
    delivery_method TEXT
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policies for public tables
DROP POLICY IF EXISTS "Allow public read access" ON public.categories;
CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read access" ON public.banners;
CREATE POLICY "Allow public read access" ON public.banners FOR SELECT USING (true);

-- Allow all operations for admin/service roles (assuming you'll have them later)
-- You can create a role, e.g., 'admin' and grant it permissions.
-- For now, we allow authenticated users to do more.
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.categories;
CREATE POLICY "Allow full access for authenticated users" ON public.categories FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.products;
CREATE POLICY "Allow full access for authenticated users" ON public.products FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.banners;
CREATE POLICY "Allow full access for authenticated users" ON public.banners FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.orders;
CREATE POLICY "Allow full access for authenticated users" ON public.orders FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.customers;
CREATE POLICY "Allow full access for authenticated users" ON public.customers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- Create a bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage
DROP POLICY IF EXISTS "Product images are publicly viewable" ON storage.objects;
CREATE POLICY "Product images are publicly viewable"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'product-images' );

DROP POLICY IF EXISTS "Anyone can upload a product image" ON storage.objects;
CREATE POLICY "Anyone can upload a product image"
  ON storage.objects FOR INSERT
  TO public -- This is the important change
  WITH CHECK ( bucket_id = 'product-images' );

DROP POLICY IF EXISTS "Anyone can update their own product images" ON storage.objects;
CREATE POLICY "Anyone can update their own product images"
    ON storage.objects FOR UPDATE
    TO public
    USING ( auth.uid() = owner_id );

DROP POLICY IF EXISTS "Anyone can delete their own product images" ON storage.objects;
CREATE POLICY "Anyone can delete their own product images"
    ON storage.objects FOR DELETE
    TO public
    USING ( auth.uid() = owner_id );


-- Seed data
INSERT INTO public.categories (name, label) VALUES
('Skincare', 'Cuidado de la Piel'),
('Makeup', 'Maquillaje'),
('Haircare', 'Cuidado del Cabello')
ON CONFLICT (name) DO NOTHING;
