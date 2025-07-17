--
-- Create products table
--
create table
  public.products (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    name character varying not null,
    description text null,
    price double precision not null,
    original_price double precision null,
    stock integer not null default 0,
    category character varying not null,
    image text null,
    featured boolean not null default false,
    ai_hint text null,
    constraint products_pkey primary key (id)
  ) tablespace pg_default;

--
-- Create categories table
--
create table
  public.categories (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    name character varying not null,
    label character varying not null,
    constraint categories_pkey primary key (id),
    constraint categories_name_key unique (name)
  ) tablespace pg_default;

--
-- Create banners table
--
create table
  public.banners (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    title character varying not null,
    description text null,
    image text null,
    ai_hint text null,
    constraint banners_pkey primary key (id)
  ) tablespace pg_default;


--
-- Set up RLS (Row Level Security)
--
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.banners enable row level security;

create policy "Allow public read access" on public.products for select using (true);
create policy "Allow public read access" on public.categories for select using (true);
create policy "Allow public read access" on public.banners for select using (true);

-- Allow authorized users to perform all actions
-- Make sure to configure your authorization rules as needed
create policy "Allow all actions for authenticated users" on public.products for all using (auth.role() = 'authenticated');
create policy "Allow all actions for authenticated users" on public.categories for all using (auth.role() = 'authenticated');
create policy "Allow all actions for authenticated users" on public.banners for all using (auth.role() = 'authenticated');


--
-- Insert Sample Data
--

-- Insert Categories
INSERT INTO public.categories (name, label) VALUES
('Skincare', 'Cuidado de la Piel'),
('Makeup', 'Maquillaje'),
('Haircare', 'Cuidado del Cabello');

-- Insert Banners
INSERT INTO public.banners (title, description, image, ai_hint) VALUES
('Colección de Verano', 'Descubre los esenciales de belleza para brillar esta temporada.', 'https://placehold.co/1200x600.png', 'summer cosmetics'),
('Piel Radiante, Pura Confianza', 'Nuestros productos de skincare te darán el brillo que mereces.', 'https://placehold.co/1200x600.png', 'skincare flatlay'),
('Ofertas Imperdibles', 'Hasta 30% de descuento en productos seleccionados. ¡No te lo pierdas!', 'https://placehold.co/1200x600.png', 'makeup sale');


-- Insert Products
INSERT INTO public.products (name, description, price, original_price, stock, category, image, featured, ai_hint) VALUES
('Glow Serum', 'A vitamin C serum for a radiant and even skin tone. Fights free radicals and boosts collagen production.', 35.00, 45.00, 25, 'Skincare', 'https://placehold.co/400x400.png', true, 'skincare serum'),
('Hydra-Boost Moisturizer', 'A lightweight, hyaluronic acid-based moisturizer for all-day hydration without a greasy feel.', 38.50, null, 50, 'Skincare', 'https://placehold.co/400x400.png', false, 'face cream'),
('Velvet Matte Lipstick', 'A long-lasting, highly pigmented matte lipstick in a classic red shade. Enriched with vitamin E.', 24.00, null, 8, 'Makeup', 'https://placehold.co/400x400.png', true, 'red lipstick'),
('Luminous Foundation', 'A medium-coverage foundation that provides a natural, luminous finish. Available in 20 shades.', 52.00, 60.00, 30, 'Makeup', 'https://placehold.co/400x400.png', true, 'makeup foundation'),
('Argan Oil Hair Repair', 'Nourishing argan oil treatment to tame frizz, add shine, and protect hair from heat damage.', 30.00, null, 0, 'Haircare', 'https://placehold.co/400x400.png', false, 'hair oil'),
('Volumizing Dry Shampoo', 'Absorbs oil and adds instant volume and texture, leaving hair feeling fresh and clean.', 18.00, null, 15, 'Haircare', 'https://placehold.co/400x400.png', false, 'hair shampoo'),
('Purifying Clay Mask', 'A deep-cleansing clay mask with activated charcoal to detoxify pores and refine skin texture.', 28.00, null, 40, 'Skincare', 'https://placehold.co/400x400.png', true, 'face mask'),
('Waterproof Mascara', 'A clump-free, waterproof mascara that lengthens and defines lashes for a dramatic look.', 26.00, null, 60, 'Makeup', 'https://placehold.co/400x400.png', false, 'eye mascara'),
('Gentle Cleansing Foam', 'A soothing cleansing foam that removes impurities without stripping natural oils. Ideal for sensitive skin.', 25.00, null, 35, 'Skincare', 'https://placehold.co/400x400.png', false, 'face wash'),
('Eyeshadow Palette', 'A versatile palette of 12 neutral and bold eyeshadows in matte and shimmer finishes.', 39.00, null, 20, 'Makeup', 'https://placehold.co/400x400.png', true, 'eyeshadow makeup'),
('Keratin Smooth Shampoo', 'Sulfate-free shampoo infused with keratin to strengthen and smooth frizzy, unmanageable hair.', 28.00, null, 45, 'Haircare', 'https://placehold.co/400x400.png', false, 'keratin shampoo'),
('Deep-Hydration Conditioner', 'A rich conditioner that detangles and provides intense moisture to dry, brittle hair.', 28.00, null, 40, 'Haircare', 'https://placehold.co/400x400.png', false, 'hair conditioner');
