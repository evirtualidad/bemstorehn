
-- Create Banners Table
create table if not exists public.banners (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    title text not null,
    description text not null,
    image text null,
    "aiHint" text null,
    constraint banners_pkey primary key (id)
);
-- RLS for Banners (allow public read)
alter table public.banners enable row level security;
create policy "Allow public read access to banners" on public.banners for select using (true);
create policy "Allow admin write access to banners" on public.banners for all using (true); -- Replace with your actual admin role check

-- Create Categories Table
create table if not exists public.categories (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    name text not null,
    label text not null,
    constraint categories_pkey primary key (id),
    constraint categories_name_key unique (name)
);
-- RLS for Categories (allow public read)
alter table public.categories enable row level security;
create policy "Allow public read access to categories" on public.categories for select using (true);
create policy "Allow admin write access to categories" on public.categories for all using (true); -- Replace with your actual admin role check

-- Create Products Table
create table if not exists public.products (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    name text not null,
    image text null,
    "aiHint" text null,
    price numeric not null,
    "originalPrice" numeric null,
    description text null,
    category text null,
    stock integer not null default 0,
    featured boolean not null default false,
    constraint products_pkey primary key (id),
    constraint products_category_fkey foreign key (category) references categories (name) on delete set null
);
-- RLS for Products (allow public read)
alter table public.products enable row level security;
create policy "Allow public read access to products" on public.products for select using (true);
create policy "Allow admin write access to products" on public.products for all using (true); -- Replace with your actual admin role check

-- Insert sample categories
insert into public.categories (name, label) values
('Skincare', 'Cuidado de la Piel'),
('Makeup', 'Maquillaje'),
('Haircare', 'Cuidado del Cabello')
on conflict (name) do nothing;
