-- Enable the UUID extension if it's not already enabled.
create extension if not exists "uuid-ossp" with schema extensions;

-- 1. Categories Table
-- Stores product categories. The "name" is used as an internal identifier, and "label" is for display.
create table if not exists public.categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    label text not null,
    created_at timestamptz not null default now()
);

-- 2. Products Table
-- Stores all product information.
create table if not exists public.products (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    image text,
    ai_hint text,
    price numeric(10, 2) not null,
    original_price numeric(10, 2),
    description text,
    category text not null references public.categories(name) on delete restrict,
    stock integer not null default 0,
    featured boolean default false,
    created_at timestamptz not null default now()
);

-- 3. Banners Table
-- Stores information for the homepage hero carousel banners.
create table if not exists public.banners (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text not null,
    image text not null,
    ai_hint text,
    created_at timestamptz not null default now()
);

-- 4. Customers Table
-- Stores customer information for order tracking and analytics.
create table if not exists public.customers (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamptz not null default now(),
    name text not null,
    phone text not null unique,
    address jsonb,
    total_spent numeric(10, 2) not null default 0,
    order_count integer not null default 0
);

-- 5. Orders Table
-- Stores all order details from both the POS and the online store.
create table if not exists public.orders (
    id uuid primary key default uuid_generate_v4(),
    display_id text unique,
    created_at timestamptz not null default now(),
    customer_id uuid references public.customers(id) on delete set null,
    customer_name text not null,
    customer_phone text not null,
    customer_address jsonb,
    items jsonb not null,
    total numeric(10, 2) not null,
    shipping_cost numeric(10, 2) default 0,
    balance numeric(10, 2) default 0,
    payments jsonb,
    payment_method text not null,
    payment_reference text,
    status text not null,
    source text not null,
    delivery_method text,
    payment_due_date timestamptz
);

-- Create a function to generate a human-readable order ID
create or replace function generate_order_display_id()
returns trigger as $$
begin
    -- Generate a random 6-character alphanumeric string
    NEW.display_id := 'ORD-' || upper(substr(md5(random()::text), 1, 6));
    return NEW;
end;
$$ language plpgsql;

-- Create a trigger to call the function before inserting a new order
create trigger set_order_display_id
before insert on public.orders
for each row
execute function generate_order_display_id();

-- POLICIES
-- Allow public read access to categories, products, and banners
alter table public.categories enable row level security;
drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories for select using (true);

alter table public.products enable row level security;
drop policy if exists "Public can read products" on public.products;
create policy "Public can read products" on public.products for select using (true);

alter table public.banners enable row level security;
drop policy if exists "Public can read banners" on public.banners;
create policy "Public can read banners" on public.banners for select using (true);

-- Allow authenticated users (admins) to manage everything
drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories" on public.categories for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products" on public.products for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Admins can manage banners" on public.banners;
create policy "Admins can manage banners" on public.banners for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Customers and Orders Policies
alter table public.customers enable row level security;
drop policy if exists "Admins can manage customers" on public.customers;
create policy "Admins can manage customers" on public.customers for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table public.orders enable row level security;
drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders" on public.orders for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


-- STORAGE BUCKET for product images
-- Create a bucket for product images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Set up policies for the product-images bucket
drop policy if exists "Product images are publicly accessible." on storage.objects;
create policy "Product images are publicly accessible." on storage.objects for select to public using (bucket_id = 'product-images');

drop policy if exists "Anyone can upload product images." on storage.objects;
create policy "Anyone can upload product images." on storage.objects for insert to public with check (bucket_id = 'product-images');

drop policy if exists "Anyone can update product images." on storage.objects;
create policy "Anyone can update product images." on storage.objects for update to public with check (bucket_id = 'product-images');

drop policy if exists "Anyone can delete product images." on storage.objects;
create policy "Anyone can delete product images." on storage.objects for delete to public using (bucket_id = 'product-images');


-- SEED DATA
-- Insert categories, ignoring duplicates
insert into public.categories (name, label)
values
    ('Skincare', 'Cuidado de la Piel'),
    ('Makeup', 'Maquillaje'),
    ('Haircare', 'Cuidado del Cabello')
on conflict (name) do nothing;

-- Note: The following inserts will fail if the script is run more than once
-- without clearing the tables first. This is generally okay for a one-time setup.
-- To make it re-runnable, you'd add ON CONFLICT clauses for each, but we'll keep it simple.
TRUNCATE public.products, public.banners RESTART IDENTITY;

-- Seed products
insert into public.products (name, image, ai_hint, price, original_price, description, category, stock, featured) values
  ('Glow Serum', 'https://placehold.co/400x400.png', 'skincare serum', 35.00, 45.00, 'A vitamin C serum for a radiant and even skin tone. Fights free radicals and boosts collagen production.', 'Skincare', 25, true),
  ('Hydra-Boost Moisturizer', 'https://placehold.co/400x400.png', 'face cream', 38.50, null, 'A lightweight, hyaluronic acid-based moisturizer for all-day hydration without a greasy feel.', 'Skincare', 50, false),
  ('Velvet Matte Lipstick', 'https://placehold.co/400x400.png', 'red lipstick', 24.00, null, 'A long-lasting, highly pigmented matte lipstick in a classic red shade. Enriched with vitamin E.', 'Makeup', 8, true),
  ('Luminous Foundation', 'https://placehold.co/400x400.png', 'makeup foundation', 52.00, 60.00, 'A medium-coverage foundation that provides a natural, luminous finish. Available in 20 shades.', 'Makeup', 30, true),
  ('Argan Oil Hair Repair', 'https://placehold.co/400x400.png', 'hair oil', 30.00, null, 'Nourishing argan oil treatment to tame frizz, add shine, and protect hair from heat damage.', 'Haircare', 0, false),
  ('Volumizing Dry Shampoo', 'https://placehold.co/400x400.png', 'hair shampoo', 18.00, null, 'Absorbs oil and adds instant volume and texture, leaving hair feeling fresh and clean.', 'Haircare', 15, false),
  ('Purifying Clay Mask', 'https://placehold.co/400x400.png', 'face mask', 28.00, null, 'A deep-cleansing clay mask with activated charcoal to detoxify pores and refine skin texture.', 'Skincare', 40, true),
  ('Waterproof Mascara', 'https://placehold.co/400x400.png', 'eye mascara', 26.00, null, 'A clump-free, waterproof mascara that lengthens and defines lashes for a dramatic look.', 'Makeup', 60, false),
  ('Gentle Cleansing Foam', 'https://placehold.co/400x400.png', 'face wash', 25.00, null, 'A soothing cleansing foam that removes impurities without stripping natural oils. Ideal for sensitive skin.', 'Skincare', 35, false),
  ('Eyeshadow Palette', 'https://placehold.co/400x400.png', 'eyeshadow makeup', 39.00, null, 'A versatile palette of 12 neutral and bold eyeshadows in matte and shimmer finishes.', 'Makeup', 20, true),
  ('Keratin Smooth Shampoo', 'https://placehold.co/400x400.png', 'keratin shampoo', 28.00, null, 'Sulfate-free shampoo infused with keratin to strengthen and smooth frizzy, unmanageable hair.', 'Haircare', 45, false),
  ('Deep-Hydration Conditioner', 'https://placehold.co/400x400.png', 'hair conditioner', 28.00, null, 'A rich conditioner that detangles and provides intense moisture to dry, brittle hair.', 'Haircare', 40, false);

-- Seed banners
insert into public.banners (title, description, image, ai_hint) values
  ('Novedades de Verano', 'Descubre nuestra nueva colección de temporada para un look fresco y radiante.', 'https://placehold.co/1200x600.png', 'summer cosmetics'),
  ('Oferta Especial en Skincare', 'Un 20% de descuento en todos los productos para el cuidado de la piel. ¡Solo por tiempo limitado!', 'https://placehold.co/1200x600.png', 'skincare sale'),
  ('Luce increíble', 'La mejor selección de maquillaje para que destaques en cualquier ocasión.', 'https://placehold.co/1200x600.png', 'makeup products');
