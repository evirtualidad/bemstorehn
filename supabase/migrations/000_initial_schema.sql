-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    image TEXT,
    "aiHint" TEXT,
    price NUMERIC(10, 2) NOT NULL,
    "originalPrice" NUMERIC(10, 2),
    description TEXT,
    category TEXT NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    "aiHint" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    address JSONB,
    total_spent NUMERIC(10, 2) DEFAULT 0,
    order_count INT DEFAULT 0
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT,
    customer_phone TEXT,
    customer_address JSONB,
    items JSONB,
    total NUMERIC(10, 2) NOT NULL,
    shipping_cost NUMERIC(10, 2) DEFAULT 0,
    balance NUMERIC(10, 2) DEFAULT 0,
    payments JSONB,
    payment_method TEXT,
    payment_reference TEXT,
    status TEXT DEFAULT 'pending-approval',
    source TEXT,
    delivery_method TEXT,
    payment_due_date TIMESTAMPTZ
);

-- Create a function to generate a short ID for orders
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  done BOOLEAN;
BEGIN
  done := FALSE;
  WHILE NOT done LOOP
    new_id := 'ORD-' || substr(to_hex(random()::int), 1, 6);
    done := NOT EXISTS(SELECT 1 FROM public.orders WHERE display_id = new_id);
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE PLPGSQL;

-- Create a trigger to auto-generate display_id for new orders
CREATE OR REPLACE FUNCTION set_order_display_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.display_id := generate_short_id();
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER set_order_display_id_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION set_order_display_id();

-- Policies for Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all tables
CREATE POLICY "Public read access for all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read access for all" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read access for all" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Public read access for all" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public read access for all" ON public.customers FOR SELECT USING (true);

-- Allow all operations for anon and authenticated users (for admin panel usage)
CREATE POLICY "Allow all for anon" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON public.banners FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON public.customers FOR ALL USING (true);


-- Initial Data Inserts
-- Use ON CONFLICT to avoid errors on re-running the script.
INSERT INTO public.categories (name, label)
VALUES
    ('Skincare', 'Cuidado de la Piel'),
    ('Makeup', 'Maquillaje'),
    ('Haircare', 'Cuidado del Cabello')
ON CONFLICT (name) DO NOTHING;

-- Supabase Storage Bucket for Product Images
-- Create a bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Clear existing policies for the bucket to avoid conflicts
DROP POLICY IF EXISTS "Public Select Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;

-- Create policies for public access to the product-images bucket
-- This policy allows anyone to view the images.
CREATE POLICY "Public Select Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- This policy allows anyone to upload images.
CREATE POLICY "Public Insert Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'product-images' );

-- This policy allows anyone to update their own images.
CREATE POLICY "Public Update Access"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'product-images' );

-- This policy allows anyone to delete their own images.
CREATE POLICY "Public Delete Access"
ON storage.objects FOR DELETE
USING ( bucket_id = 'product-images' );
