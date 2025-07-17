
-- Enable Realtime for all tables
alter publication supabase_realtime add table banners, categories, customers, orders, products;

-- Create Banners Table
CREATE TABLE if not exists banners (
  id uuid default gen_random_uuid() not null,
  created_at timestamp with time zone not null default now(),
  title character varying not null,
  description text not null,
  image text not null,
  aiHint text,
  constraint banners_pkey primary key (id)
);
-- RLS for Banners Table
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_banners_select" ON public.banners FOR SELECT USING (true);
CREATE POLICY "allow_authenticated_banners_insert" ON public.banners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_authenticated_banners_update" ON public.banners FOR UPDATE TO authenticated USING (true);
CREATE POLICY "allow_authenticated_banners_delete" ON public.banners FOR DELETE TO authenticated USING (true);


-- Create Categories Table
CREATE TABLE if not exists categories (
  id uuid default gen_random_uuid() not null,
  created_at timestamp with time zone not null default now(),
  name text not null,
  label text not null,
  constraint categories_pkey primary key (id),
  constraint categories_name_key unique (name)
);
-- RLS for Categories Table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_categories_select" ON public.categories FOR SELECT USING (true);
CREATE POLICY "allow_authenticated_categories_insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_authenticated_categories_update" ON public.categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "allow_authenticated_categories_delete" ON public.categories FOR DELETE TO authenticated USING (true);


-- Create Products Table
CREATE TABLE if not exists products (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    description text NULL,
    price real NOT NULL,
    "originalPrice" real NULL,
    stock integer NOT NULL,
    image text NULL,
    "aiHint" text NULL,
    category text NOT NULL,
    featured boolean NOT NULL DEFAULT false,
    CONSTRAINT products_pkey PRIMARY KEY (id)
);
-- RLS for Products Table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_products_select" ON public.products FOR SELECT USING (true);
CREATE POLICY "allow_authenticated_products_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_authenticated_products_update" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "allow_authenticated_products_delete" ON public.products FOR DELETE TO authenticated USING (true);


-- Create Customers Table
CREATE TABLE if not exists customers (
  id uuid default gen_random_uuid() not null,
  created_at timestamp with time zone not null default now(),
  name text not null,
  phone text not null,
  address jsonb,
  total_spent real not null default '0'::double precision,
  order_count integer not null default 0,
  constraint customers_pkey primary key (id),
  constraint customers_phone_key unique (phone)
);
-- RLS for Customers Table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_customers_select" ON public.customers FOR SELECT USING (true);
CREATE POLICY "allow_authenticated_customers_insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_authenticated_customers_update" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "allow_authenticated_customers_delete" ON public.customers FOR DELETE TO authenticated USING (true);


-- Create Orders Table
CREATE TABLE if not exists orders (
  id uuid default gen_random_uuid() not null,
  display_id text not null default concat('ORD-', "substring"(uuid_generate_v4()::text, 1, 6)),
  created_at timestamp with time zone not null default now(),
  customer_id uuid,
  customer_name text not null,
  customer_phone text,
  customer_address jsonb,
  items jsonb not null,
  total real not null,
  shipping_cost real not null default '0'::double precision,
  balance real not null default '0'::double precision,
  payments jsonb not null default '[]'::jsonb,
  payment_method text not null,
  payment_reference text,
  payment_due_date timestamp with time zone,
  status text not null,
  source text not null,
  delivery_method text,
  constraint orders_pkey primary key (id),
  constraint orders_display_id_key unique (display_id),
  constraint orders_customer_id_fkey foreign key (customer_id) references customers (id) on delete set null
);
-- RLS for Orders Table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_orders_select" ON public.orders FOR SELECT USING (true);
CREATE POLICY "allow_authenticated_orders_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_authenticated_orders_update" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "allow_authenticated_orders_delete" ON public.orders FOR DELETE TO authenticated USING (true);


-- Create Storage Buckets
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('banner-images', 'banner-images', true)
on conflict (id) do nothing;


-- Create Policies for product-images bucket
DROP POLICY IF EXISTS "allow_all_product_select" ON storage.objects;
CREATE POLICY "allow_all_product_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "allow_authenticated_product_insert" ON storage.objects;
CREATE POLICY "allow_authenticated_product_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');


-- Create Policies for banner-images bucket
DROP POLICY IF EXISTS "allow_all_banner_select" ON storage.objects;
CREATE POLICY "allow_all_banner_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'banner-images');

DROP POLICY IF EXISTS "allow_authenticated_banner_insert" ON storage.objects;
CREATE POLICY "allow_authenticated_banner_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'banner-images' AND auth.role() = 'authenticated');

