
-- Enable UUID generation
create extension if not exists "uuid-ossp" with schema extensions;

-- Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL
);
-- RLS for Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (true);


-- Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    stock INT NOT NULL,
    category TEXT,
    image TEXT,
    ai_hint TEXT,
    featured BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_category
        FOREIGN KEY(category) 
        REFERENCES public.categories(name)
        ON DELETE SET NULL
);
-- RLS for Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);


-- Create Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    ai_hint TEXT
);
-- RLS for Banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to banners" ON public.banners FOR SELECT USING (true);


-- Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    address JSONB,
    total_spent NUMERIC DEFAULT 0,
    order_count INT DEFAULT 0
);
-- RLS for Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- For now, let's allow service_role access. In a real app, you'd have more specific auth policies.
CREATE POLICY "Allow all access for service roles" ON public.customers FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');


-- Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_id TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || substr(uuid_generate_v4()::text, 1, 6),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address JSONB,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    shipping_cost NUMERIC DEFAULT 0,
    balance NUMERIC NOT NULL DEFAULT 0,
    payments JSONB DEFAULT '[]'::jsonb,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia', 'credito')),
    payment_reference TEXT,
    payment_due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending-approval' CHECK (status IN ('pending-approval', 'pending-payment', 'paid', 'cancelled')),
    source TEXT NOT NULL CHECK (source IN ('pos', 'online-store')),
    delivery_method TEXT CHECK (delivery_method IN ('pickup', 'delivery'))
);
-- RLS for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for service roles on orders" ON public.orders FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');


-- Insert Sample Data

-- Categories
INSERT INTO public.categories (name, label) VALUES
('skincare', 'Cuidado de la Piel'),
('makeup', 'Maquillaje'),
('haircare', 'Cuidado del Cabello')
ON CONFLICT (name) DO NOTHING;

-- Products
INSERT INTO public.products (name, description, price, original_price, stock, category, image, featured, ai_hint) VALUES
('Glow Serum', 'A vitamin C serum for a radiant and even skin tone. Fights free radicals and boosts collagen production.', 850.00, 950.00, 25, 'skincare', 'https://placehold.co/400x400.png', true, 'skincare serum'),
('Hydra-Boost Moisturizer', 'A lightweight, hyaluronic acid-based moisturizer for all-day hydration without a greasy feel.', 750.00, null, 50, 'skincare', 'https://placehold.co/400x400.png', false, 'face cream'),
('Velvet Matte Lipstick', 'A long-lasting, highly pigmented matte lipstick in a classic red shade. Enriched with vitamin E.', 450.00, null, 8, 'makeup', 'https://placehold.co/400x400.png', true, 'red lipstick'),
('Luminous Foundation', 'A medium-coverage foundation that provides a natural, luminous finish. Available in 20 shades.', 1200.00, 1350.00, 30, 'makeup', 'https://placehold.co/400x400.png', true, 'makeup foundation'),
('Argan Oil Hair Repair', 'Nourishing argan oil treatment to tame frizz, add shine, and protect hair from heat damage.', 600.00, null, 0, 'haircare', 'https://placehold.co/400x400.png', false, 'hair oil'),
('Volumizing Dry Shampoo', 'Absorbs oil and adds instant volume and texture, leaving hair feeling fresh and clean.', 350.00, null, 15, 'haircare', 'https://placehold.co/400x400.png', false, 'haircare'),
('Purifying Clay Mask', 'A deep-cleansing clay mask with activated charcoal to detoxify pores and refine skin texture.', 550.00, null, 40, 'skincare', 'https://placehold.co/400x400.png', true, 'face mask'),
('Waterproof Mascara', 'A clump-free, waterproof mascara that lengthens and defines lashes for a dramatic look.', 480.00, null, 60, 'makeup', 'https://placehold.co/400x400.png', false, 'eye mascara')
ON CONFLICT (name) DO NOTHING;

-- Banners
INSERT INTO public.banners (title, description, image, ai_hint) VALUES
('Colección de Verano', 'Descubre nuestros nuevos productos para un look fresco y radiante.', 'https://placehold.co/1200x600.png', 'summer cosmetics'),
('20% de Descuento en Skincare', 'Cuida tu piel con los mejores productos y aprovecha nuestras ofertas.', 'https://placehold.co/1200x600.png', 'skincare sale'),
('Esenciales de Maquillaje', 'Todo lo que necesitas para un maquillaje perfecto, desde bases hasta labiales.', 'https://placehold.co/1200x600.png', 'makeup essentials')
ON CONFLICT (title) DO NOTHING;
