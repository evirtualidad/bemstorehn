-- Habilitar la extensión para generar UUIDs si no está habilitada
create extension if not exists "uuid-ossp" with schema extensions;

-- Tabla para Categorías de Productos
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

-- Tabla para Productos
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(10, 2) not null,
  original_price numeric(10, 2),
  image text,
  ai_hint text,
  category text not null,
  stock integer not null default 0,
  featured boolean default false,
  created_at timestamptz not null default now()
);

-- Tabla para Banners del Carrusel
create table if not exists public.banners (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  image text,
  ai_hint text,
  created_at timestamptz not null default now()
);

-- Tabla para Clientes
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null unique,
  address jsonb,
  total_spent numeric(10, 2) not null default 0,
  order_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Tabla para Pedidos
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  display_id text unique not null default concat('BEM-', substr(upper(md5(random()::text)), 1, 6)),
  created_at timestamptz not null default now(),
  customer_id uuid references public.customers(id),
  customer_name text not null,
  customer_phone text,
  customer_address jsonb,
  items jsonb not null,
  total numeric(10, 2) not null,
  shipping_cost numeric(10, 2) not null default 0,
  balance numeric(10, 2) not null default 0,
  payments jsonb,
  payment_method text not null,
  payment_due_date timestamptz,
  payment_reference text,
  status text not null,
  source text not null,
  delivery_method text
);

-- Políticas de Seguridad (Row Level Security)

-- Permitir acceso público de lectura a categorías, productos y banners
alter table public.categories enable row level security;
drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories for select using (true);

alter table public.products enable row level security;
drop policy if exists "Public can read products" on public.products;
create policy "Public can read products" on public.products for select using (true);

alter table public.banners enable row level security;
drop policy if exists "Public can read banners" on public.banners;
create policy "Public can read banners" on public.banners for select using (true);

-- Permitir a usuarios autenticados gestionar datos
drop policy if exists "Authenticated users can manage data" on public.categories;
create policy "Authenticated users can manage data" on public.categories for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can manage data" on public.products;
create policy "Authenticated users can manage data" on public.products for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can manage data" on public.banners;
create policy "Authenticated users can manage data" on public.banners for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Permitir a usuarios autenticados gestionar pedidos y clientes
alter table public.orders enable row level security;
drop policy if exists "Authenticated users can manage data" on public.orders;
create policy "Authenticated users can manage data" on public.orders for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

alter table public.customers enable row level security;
drop policy if exists "Authenticated users can manage data" on public.customers;
create policy "Authenticated users can manage data" on public.customers for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');


-- Insertar datos de ejemplo
-- Insertar categorías
INSERT INTO public.categories (name, label) VALUES
('Skincare', 'Cuidado de la Piel'),
('Makeup', 'Maquillaje'),
('Haircare', 'Cuidado del Cabello')
ON CONFLICT (name) DO NOTHING;

-- Seed data for products
INSERT INTO public.products (name, image, ai_hint, price, original_price, description, category, stock, featured) VALUES
('Glow Serum', 'https://placehold.co/400x400.png', 'skincare serum', 35.00, 45.00, 'A vitamin C serum for a radiant and even skin tone. Fights free radicals and boosts collagen production.', 'Skincare', 25, true),
('Hydra-Boost Moisturizer', 'https://placehold.co/400x400.png', 'face cream', 38.50, NULL, 'A lightweight, hyaluronic acid-based moisturizer for all-day hydration without a greasy feel.', 'Skincare', 50, false),
('Velvet Matte Lipstick', 'https://placehold.co/400x400.png', 'red lipstick', 24.00, NULL, 'A long-lasting, highly pigmented matte lipstick in a classic red shade. Enriched with vitamin E.', 'Makeup', 8, true),
('Luminous Foundation', 'https://placehold.co/400x400.png', 'makeup foundation', 52.00, 60.00, 'A medium-coverage foundation that provides a natural, luminous finish. Available in 20 shades.', 'Makeup', 30, true),
('Argan Oil Hair Repair', 'https://placehold.co/400x400.png', 'hair oil', 30.00, NULL, 'Nourishing argan oil treatment to tame frizz, add shine, and protect hair from heat damage.', 'Haircare', 0, false),
('Volumizing Dry Shampoo', 'https://placehold.co/400x400.png', 'hair shampoo', 18.00, NULL, 'Absorbs oil and adds instant volume and texture, leaving hair feeling fresh and clean.', 'Haircare', 15, false),
('Purifying Clay Mask', 'https://placehold.co/400x400.png', 'face mask', 28.00, NULL, 'A deep-cleansing clay mask with activated charcoal to detoxify pores and refine skin texture.', 'Skincare', 40, true),
('Waterproof Mascara', 'https://placehold.co/400x400.png', 'eye mascara', 26.00, NULL, 'A clump-free, waterproof mascara that lengthens and defines lashes for a dramatic look.', 'Makeup', 60, false)
ON CONFLICT (name) DO NOTHING;


-- Seed data for banners
INSERT INTO public.banners (title, description, image, ai_hint) VALUES
('Verano Radiante', 'Descubre nuestros productos estrella para un look fresco y luminoso esta temporada.', 'https://placehold.co/1200x600.png', 'summer cosmetics'),
('Cuidado Esencial', 'Todo lo que tu piel necesita para sentirse hidratada y protegida cada día.', 'https://placehold.co/1200x600.png', 'skincare routine'),
('Ofertas Imperdibles', 'Aprovecha descuentos de hasta el 20% en productos seleccionados. ¡Solo por tiempo limitado!', 'https://placehold.co/1200x600.png', 'makeup sale')
ON CONFLICT (title) DO NOTHING;


-- Storage Bucket para Imágenes de Productos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Políticas para Storage
-- Permitir acceso público de lectura a las imágenes
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
CREATE POLICY "Public read access for product images" ON storage.objects FOR SELECT
TO anon, authenticated
USING ( bucket_id = 'product-images' );

-- Permitir a usuarios autenticados subir, actualizar y eliminar imágenes
DROP POLICY IF EXISTS "Authenticated users can manage product images" ON storage.objects;
CREATE POLICY "Authenticated users can manage product images" ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'product-images' );
