
-- Enable the "pg_cron" extension
create extension if not exists "pg_cron" with schema "extensions";

-- Enable the "pg_net" extension
create extension if not exists "pg_net" with schema "extensions";

-- Enable the "uuid-ossp" extension
create extension if not exists "uuid-ossp" with schema "extensions";

-- #############################################################################
-- ### Tables
-- #############################################################################

-- Create Products table
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    "originalPrice" numeric,
    stock integer NOT NULL,
    category text NOT NULL,
    image text,
    featured boolean DEFAULT false,
    "aiHint" text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;


-- Create Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    label text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    display_id text UNIQUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_id uuid,
    customer_name text,
    customer_phone text,
    customer_address jsonb,
    items jsonb NOT NULL,
    total numeric NOT NULL,
    shipping_cost numeric DEFAULT 0,
    balance numeric DEFAULT 0,
    payments jsonb DEFAULT '[]'::jsonb,
    payment_method text NOT NULL,
    payment_reference text,
    status text NOT NULL,
    source text NOT NULL,
    delivery_method text,
    payment_due_date timestamp with time zone
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    phone text NOT NULL UNIQUE,
    address jsonb,
    total_spent numeric DEFAULT 0 NOT NULL,
    order_count integer DEFAULT 0 NOT NULL
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create Banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  image text NOT NULL,
  "aiHint" text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;


-- #############################################################################
-- ### Relationships
-- #############################################################################

ALTER TABLE public.orders
ADD CONSTRAINT fk_customer
FOREIGN KEY (customer_id)
REFERENCES public.customers(id)
ON DELETE SET NULL;


-- #############################################################################
-- ### Functions and Triggers for display_id
-- #############################################################################

-- Function to generate a random string for the display_id
CREATE OR REPLACE FUNCTION generate_order_display_id()
RETURNS text AS $$
DECLARE
  new_id text;
  is_duplicate boolean;
BEGIN
  LOOP
    new_id := 'ORD-' || substr(upper(md5(random()::text)), 1, 6);
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE display_id = new_id) INTO is_duplicate;
    IF NOT is_duplicate THEN
      RETURN new_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set display_id on new order
CREATE OR REPLACE FUNCTION set_order_display_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.display_id = generate_order_display_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, to prevent errors on re-run
DROP TRIGGER IF EXISTS trigger_set_order_display_id ON public.orders;

CREATE TRIGGER trigger_set_order_display_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION set_order_display_id();


-- #############################################################################
-- ### Policies (Row Level Security)
-- #############################################################################

-- Policies for Products
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage products" ON public.products FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Policies for Categories
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Policies for Orders
CREATE POLICY "Allow authenticated users to manage orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow public insert for new orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Policies for Customers
CREATE POLICY "Allow authenticated users to manage customers" ON public.customers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow public insert for new customers" ON public.customers FOR INSERT WITH CHECK (true);


-- Policies for Banners
CREATE POLICY "Allow public read access to banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage banners" ON public.banners FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- #############################################################################
-- ### Storage
-- #############################################################################

-- Storage for Products
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Policies for product-images bucket
CREATE POLICY "Allow public read access on product images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' );

CREATE POLICY "Allow authenticated users to update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'product-images' );

CREATE POLICY "Allow authenticated users to delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'product-images' );


-- Storage for Banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('banner-images', 'banner-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Policies for banner-images bucket
CREATE POLICY "Allow public read access on banner images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'banner-images' );

CREATE POLICY "Allow authenticated users to upload banner images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'banner-images' );

CREATE POLICY "Allow authenticated users to update banner images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'banner-images' );

CREATE POLICY "Allow authenticated users to delete banner images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'banner-images' );


-- #############################################################################
-- ### Initial Data
-- #############################################################################

-- Insert initial categories, do nothing if they already exist
INSERT INTO public.categories (name, label) VALUES
  ('Skincare', 'Cuidado de la Piel'),
  ('Makeup', 'Maquillaje'),
  ('Haircare', 'Cuidado del Cabello')
ON CONFLICT (name) DO NOTHING;


-- Insert initial products
-- The INSERT statement for products is removed to avoid errors on re-run.
-- The user will add their own products through the admin interface.
-- This ensures the schema can be run multiple times without causing duplicate key errors.

-- Insert initial banners
-- The INSERT statement for banners is removed for the same reason as products.
-- This prevents errors on re-run and allows user to manage banners from the UI.
