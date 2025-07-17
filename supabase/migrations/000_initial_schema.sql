-- Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL
);

-- Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    stock INT NOT NULL,
    category TEXT REFERENCES public.categories(name) ON DELETE SET NULL,
    image TEXT,
    ai_hint TEXT,
    featured BOOLEAN DEFAULT FALSE
);

-- Create Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    ai_hint TEXT
);

-- Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    address JSONB,
    total_spent NUMERIC DEFAULT 0,
    order_count INT DEFAULT 0
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address JSONB,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    shipping_cost NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    payments JSONB DEFAULT '[]'::jsonb,
    payment_method TEXT,
    payment_reference TEXT,
    status TEXT NOT NULL,
    source TEXT NOT NULL,
    delivery_method TEXT,
    payment_due_date TIMESTAMPTZ
);

-- Function to generate a short unique ID for orders
CREATE OR REPLACE FUNCTION generate_order_display_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.display_id := 'ORD-' || substr(to_hex(random()::int), 1, 6);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set display_id on new orders
DROP TRIGGER IF EXISTS set_order_display_id ON public.orders;
CREATE TRIGGER set_order_display_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_display_id();

-- RLS Policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access to products, categories, and banners
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view banners" ON public.banners;
CREATE POLICY "Public can view banners" ON public.banners FOR SELECT USING (true);

-- Allow authenticated users to perform all actions on their own data (placeholder for auth)
-- In a real app, you would restrict this further based on user roles (e.g., admin).
-- For now, we'll allow anon key to do everything for simplicity during setup.
DROP POLICY IF EXISTS "Anon can manage tables" ON public.products;
CREATE POLICY "Anon can manage tables" ON public.products FOR ALL USING (true);

DROP POLICY IF EXISTS "Anon can manage categories" ON public.categories;
CREATE POLICY "Anon can manage categories" ON public.categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Anon can manage banners" ON public.banners;
CREATE POLICY "Anon can manage banners" ON public.banners FOR ALL USING (true);

DROP POLICY IF EXISTS "Anon can manage customers" ON public.customers;
CREATE POLICY "Anon can manage customers" ON public.customers FOR ALL USING (true);

DROP POLICY IF EXISTS "Anon can manage orders" ON public.orders;
CREATE POLICY "Anon can manage orders" ON public.orders FOR ALL USING (true);

-- Clear existing data before inserting new sample data
TRUNCATE public.products, public.categories, public.banners RESTART IDENTITY CASCADE;

-- Insert Sample Data
-- Categories
INSERT INTO public.categories (name, label) VALUES
('Skincare', 'Cuidado de la Piel'),
('Makeup', 'Maquillaje'),
('Haircare', 'Cuidado del Cabello')
ON CONFLICT (name) DO NOTHING;

-- Products
INSERT INTO public.products (name, description, price, original_price, stock, category, image, ai_hint, featured) VALUES
('Glow Serum', 'A vitamin C serum for a radiant and even skin tone. Fights free radicals and boosts collagen production.', 35.00, 45.00, 25, 'Skincare', 'https://placehold.co/400x400.png', 'skincare serum', true),
('Hydra-Boost Moisturizer', 'A lightweight, hyaluronic acid-based moisturizer for all-day hydration without a greasy feel.', 38.50, NULL, 50, 'Skincare', 'https://placehold.co/400x400.png', 'face cream', false),
('Velvet Matte Lipstick', 'A long-lasting, highly pigmented matte lipstick in a classic red shade. Enriched with vitamin E.', 24.00, NULL, 8, 'Makeup', 'https://placehold.co/400x400.png', 'red lipstick', true),
('Luminous Foundation', 'A medium-coverage foundation that provides a natural, luminous finish. Available in 20 shades.', 52.00, 60.00, 30, 'Makeup', 'https://placehold.co/400x400.png', 'makeup foundation', true),
('Argan Oil Hair Repair', 'Nourishing argan oil treatment to tame frizz, add shine, and protect hair from heat damage.', 30.00, NULL, 0, 'Haircare', 'https://placehold.co/400x400.png', 'hair oil', false),
('Volumizing Dry Shampoo', 'Absorbs oil and adds instant volume and texture, leaving hair feeling fresh and clean.', 18.00, NULL, 15, 'Haircare', 'https://placehold.co/400x400.png', 'hair shampoo', false),
('Purifying Clay Mask', 'A deep-cleansing clay mask with activated charcoal to detoxify pores and refine skin texture.', 28.00, NULL, 40, 'Skincare', 'https://placehold.co/400x400.png', 'face mask', true),
('Waterproof Mascara', 'A clump-free, waterproof mascara that lengthens and defines lashes for a dramatic look.', 26.00, NULL, 60, 'Makeup', 'https://placehold.co/400x400.png', 'eye mascara', false),
('Gentle Cleansing Foam', 'A soothing cleansing foam that removes impurities without stripping natural oils. Ideal for sensitive skin.', 25.00, NULL, 35, 'Skincare', 'https://placehold.co/400x400.png', 'face wash', false),
('Eyeshadow Palette', 'A versatile palette of 12 neutral and bold eyeshadows in matte and shimmer finishes.', 39.00, NULL, 20, 'Makeup', 'https://placehold.co/400x400.png', 'eyeshadow makeup', true),
('Keratin Smooth Shampoo', 'Sulfate-free shampoo infused with keratin to strengthen and smooth frizzy, unmanageable hair.', 28.00, NULL, 45, 'Haircare', 'https://placehold.co/400x400.png', 'keratin shampoo', false),
('Deep-Hydration Conditioner', 'A rich conditioner that detangles and provides intense moisture to dry, brittle hair.', 28.00, NULL, 40, 'Haircare', 'https://placehold.co/400x400.png', 'hair conditioner', false);

-- Banners
INSERT INTO public.banners (title, description, image, ai_hint) VALUES
('Colección de Verano Radiante', 'Descubre nuestros nuevos productos para un look fresco y luminoso esta temporada.', 'https://placehold.co/1200x600.png', 'summer cosmetics'),
('Esenciales de Maquillaje', 'Todo lo que necesitas para un look impecable, desde bases hasta labiales.', 'https://placehold.co/1200x600.png', 'makeup flatlay'),
('Cuidado del Cabello de Lujo', 'Transforma tu cabello con nuestras fórmulas nutritivas y reparadoras.', 'https://placehold.co/1200x600.png', 'luxury haircare');
