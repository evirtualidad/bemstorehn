-- Enable UUID generation
create extension if not exists "uuid-ossp" with schema extensions;

-- Drop existing tables in reverse order of dependency
drop table if exists public.orders cascade;
drop table if exists public.customers cascade;
drop table if exists public.products cascade;
drop table if exists public.categories cascade;
drop table if exists public.banners cascade;

-- Create categories table
create table if not exists public.categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    label text not null,
    created_at timestamptz default now()
);

-- Create products table
create table if not exists public.products (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    image text,
    ai_hint text,
    price numeric(10, 2) not null,
    original_price numeric(10, 2),
    description text,
    category text not null,
    stock integer not null default 0,
    featured boolean default false,
    updated_at timestamptz default now(),
    foreign key (category) references public.categories(name) on delete cascade
);

-- Create banners table
create table if not exists public.banners (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text,
    image text,
    ai_hint text,
    created_at timestamptz default now()
);

-- Create customers table
create table if not exists public.customers (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamptz default now(),
    name text not null,
    phone text not null unique,
    address jsonb,
    total_spent numeric(10, 2) not null default 0,
    order_count integer not null default 0
);

-- Create orders table
create table if not exists public.orders (
    id uuid primary key default uuid_generate_v4(),
    display_id text unique,
    created_at timestamptz default now(),
    customer_id uuid references public.customers(id),
    customer_name text not null,
    customer_phone text,
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

-- Create function to generate short, random, and unique order IDs
create or replace function generate_order_display_id()
returns text as $$
declare
  new_id text;
  is_duplicate boolean;
begin
  loop
    new_id := 'ORD-' || upper(substr(md5(random()::text), 0, 7));
    select exists(select 1 from public.orders where display_id = new_id) into is_duplicate;
    if not is_duplicate then
      return new_id;
    end if;
  end loop;
end;
$$ language plpgsql;

-- Create a trigger to auto-assign the display_id before insert
create or replace function set_order_display_id()
returns trigger as $$
begin
  if new.display_id is null then
    new.display_id := generate_order_display_id();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_set_order_display_id on public.orders;
create trigger trigger_set_order_display_id
before insert on public.orders
for each row execute function set_order_display_id();

-- POLICIES
-- Enable RLS for all tables
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.banners enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;

-- Policies for public read access
drop policy if exists "Allow public read access to categories" on public.categories;
create policy "Allow public read access to categories" on public.categories for select using (true);

drop policy if exists "Allow public read access to products" on public.products;
create policy "Allow public read access to products" on public.products for select using (true);

drop policy if exists "Allow public read access to banners" on public.banners;
create policy "Allow public read access to banners" on public.banners for select using (true);

-- Policies for admin full access
drop policy if exists "Allow full access to admins for categories" on public.categories;
create policy "Allow full access to admins for categories" on public.categories for all using (true) with check (true);

drop policy if exists "Allow full access to admins for products" on public.products;
create policy "Allow full access to admins for products" on public.products for all using (true) with check (true);

drop policy if exists "Allow full access to admins for banners" on public.banners;
create policy "Allow full access to admins for banners" on public.banners for all using (true) with check (true);

drop policy if exists "Allow full access to admins for customers" on public.customers;
create policy "Allow full access to admins for customers" on public.customers for all using (true) with check (true);

drop policy if exists "Allow full access to admins for orders" on public.orders;
create policy "Allow full access to admins for orders" on public.orders for all using (true) with check (true);


-- STORAGE
-- Create a bucket for product images if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, Array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Policies for storage
drop policy if exists "Allow public read access to product images" on storage.objects;
create policy "Allow public read access to product images"
on storage.objects for select
using ( bucket_id = 'product-images' );

drop policy if exists "Allow authenticated users to upload product images" on storage.objects;
create policy "Allow authenticated users to upload product images"
on storage.objects for insert
with check ( bucket_id = 'product-images' and auth.role() = 'authenticated' );

drop policy if exists "Allow authenticated users to update their own images" on storage.objects;
create policy "Allow authenticated users to update their own images"
on storage.objects for update
using ( auth.uid() = owner )
with check ( bucket_id = 'product-images' );

-- SEED DATA
-- Seed categories
insert into public.categories (name, label)
values
    ('Skincare', 'Cuidado de la Piel'),
    ('Makeup', 'Maquillaje'),
    ('Haircare', 'Cuidado del Cabello')
on conflict (name) do nothing;

-- Seed products
insert into public.products (name, image, ai_hint, price, original_price, description, category, stock, featured)
values
    ('Glow Serum', 'https://placehold.co/400x400.png', 'skincare serum', 35.00, 45.00, 'A vitamin C serum for a radiant and even skin tone. Fights free radicals and boosts collagen production.', 'Skincare', 25, true),
    ('Hydra-Boost Moisturizer', 'https://placehold.co/400x400.png', 'face cream', 38.50, null, 'A lightweight, hyaluronic acid-based moisturizer for all-day hydration without a greasy feel.', 'Skincare', 50, false),
    ('Velvet Matte Lipstick', 'https://placehold.co/400x400.png', 'red lipstick', 24.00, null, 'A long-lasting, highly pigmented matte lipstick in a classic red shade. Enriched with vitamin E.', 'Makeup', 8, true),
    ('Luminous Foundation', 'https://placehold.co/400x400.png', 'makeup foundation', 52.00, 60.00, 'A medium-coverage foundation that provides a natural, luminous finish. Available in 20 shades.', 'Makeup', 30, true),
    ('Argan Oil Hair Repair', 'https://placehold.co/400x400.png', 'hair oil', 30.00, null, 'Nourishing argan oil treatment to tame frizz, add shine, and protect hair from heat damage.', 'Haircare', 0, false),
    ('Volumizing Dry Shampoo', 'https://placehold.co/400x400.png', 'hair shampoo', 18.00, null, 'Absorbs oil and adds instant volume and texture, leaving hair feeling fresh and clean.', 'Haircare', 15, false),
    ('Purifying Clay Mask', 'https://placehold.co/400x400.png', 'face mask', 28.00, null, 'A deep-cleansing clay mask with activated charcoal to detoxify pores and refine skin texture.', 'Skincare', 40, true),
    ('Waterproof Mascara', 'https://placehold.co/400x400.png', 'eye mascara', 26.00, null, 'A clump-free, waterproof mascara that lengthens and defines lashes for a dramatic look.', 'Makeup', 60, false);
    
-- Seed banners
insert into public.banners (title, description, image, ai_hint)
values
    ('Novedades de Verano', 'Descubre nuestra nueva colección de temporada, llena de colores vibrantes y fórmulas ligeras.', 'https://placehold.co/1200x600.png', 'summer cosmetics'),
    ('20% de Descuento en Skincare', 'Cuida tu piel con los mejores productos y aprovecha nuestras ofertas especiales por tiempo limitado.', 'https://placehold.co/1200x600.png', 'skincare sale'),
    ('Luce Radiante', 'Encuentra todo lo que necesitas para un maquillaje perfecto, desde bases hasta labiales de larga duración.', 'https://placehold.co/1200x600.png', 'makeup flatlay');
