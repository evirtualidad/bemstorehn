-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Drop tables in reverse order of creation to handle dependencies
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "banners" CASCADE;
DROP TABLE IF EXISTS "customers" CASCADE;
DROP SEQUENCE IF EXISTS orders_display_id_seq;

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to categories" ON categories FOR SELECT USING (true);


-- Create products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  ai_hint TEXT,
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  description TEXT,
  category TEXT NOT NULL,
  stock INT NOT NULL,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_category
    FOREIGN KEY(category) 
    REFERENCES categories(name)
    ON DELETE SET NULL
);
-- RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to products" ON products FOR SELECT USING (true);


-- Create banners table
CREATE TABLE banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  ai_hint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS for banners
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to banners" ON banners FOR SELECT USING (true);


-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  address JSONB,
  total_spent NUMERIC(10, 2) DEFAULT 0,
  order_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- For now, let's keep it simple and allow all access within the app (anon/service key)
-- You might want to restrict this further in a real production environment
CREATE POLICY "Allow all access to customers" ON customers FOR ALL USING (true) WITH CHECK (true);


-- Create a sequence for user-friendly order IDs
CREATE SEQUENCE orders_display_id_seq START WITH 1001;

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  display_id TEXT NOT NULL UNIQUE DEFAULT ('BEM-' || nextval('orders_display_id_seq')),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address JSONB,
  items JSONB NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  balance NUMERIC(10, 2) DEFAULT 0,
  payments JSONB,
  payment_method TEXT,
  payment_reference TEXT,
  payment_due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending-approval',
  source TEXT NOT NULL,
  delivery_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to orders" ON orders FOR ALL USING (true) WITH CHECK (true);


-- Seed data for categories
INSERT INTO categories (name, label) VALUES
('skincare', 'Cuidado de la Piel'),
('makeup', 'Maquillaje'),
('haircare', 'Cuidado del Cabello')
ON CONFLICT (name) DO NOTHING;


-- Seed data for products
INSERT INTO products (id, name, image, ai_hint, price, original_price, description, category, stock, featured) VALUES
('prod_001', 'Glow Serum', 'https://placehold.co/400x400.png', 'skincare serum', 35.00, 45.00, 'A vitamin C serum for a radiant and even skin tone. Fights free radicals and boosts collagen production.', 'skincare', 25, true),
('prod_002', 'Hydra-Boost Moisturizer', 'https://placehold.co/400x400.png', 'face cream', 38.50, NULL, 'A lightweight, hyaluronic acid-based moisturizer for all-day hydration without a greasy feel.', 'skincare', 50, false),
('prod_003', 'Velvet Matte Lipstick', 'https://placehold.co/400x400.png', 'red lipstick', 24.00, NULL, 'A long-lasting, highly pigmented matte lipstick in a classic red shade. Enriched with vitamin E.', 'makeup', 8, true),
('prod_004', 'Luminous Foundation', 'https://placehold.co/400x400.png', 'makeup foundation', 52.00, 60.00, 'A medium-coverage foundation that provides a natural, luminous finish. Available in 20 shades.', 'makeup', 30, true),
('prod_005', 'Argan Oil Hair Repair', 'https://placehold.co/400x400.png', 'hair oil', 30.00, NULL, 'Nourishing argan oil treatment to tame frizz, add shine, and protect hair from heat damage.', 'haircare', 0, false),
('prod_006', 'Volumizing Dry Shampoo', 'https://placehold.co/400x400.png', 'hair shampoo', 18.00, NULL, 'Absorbs oil and adds instant volume and texture, leaving hair feeling fresh and clean.', 'haircare', 15, false),
('prod_007', 'Purifying Clay Mask', 'https://placehold.co/400x400.png', 'face mask', 28.00, NULL, 'A deep-cleansing clay mask with activated charcoal to detoxify pores and refine skin texture.', 'skincare', 40, true),
('prod_008', 'Waterproof Mascara', 'https://placehold.co/400x400.png', 'eye mascara', 26.00, NULL, 'A clump-free, waterproof mascara that lengthens and defines lashes for a dramatic look.', 'makeup', 60, false),
('prod_009', 'Gentle Cleansing Foam', 'https://placehold.co/400x400.png', 'face wash', 25.00, NULL, 'A soothing cleansing foam that removes impurities without stripping natural oils. Ideal for sensitive skin.', 'skincare', 35, false),
('prod_010', 'Eyeshadow Palette', 'https://placehold.co/400x400.png', 'eyeshadow makeup', 39.00, NULL, 'A versatile palette of 12 neutral and bold eyeshadows in matte and shimmer finishes.', 'makeup', 20, true),
('prod_011', 'Keratin Smooth Shampoo', 'https://placehold.co/400x400.png', 'keratin shampoo', 28.00, NULL, 'Sulfate-free shampoo infused with keratin to strengthen and smooth frizzy, unmanageable hair.', 'haircare', 45, false),
('prod_012', 'Deep-Hydration Conditioner', 'https://placehold.co/400x400.png', 'hair conditioner', 28.00, NULL, 'A rich conditioner that detangles and provides intense moisture to dry, brittle hair.', 'haircare', 40, false)
ON CONFLICT (id) DO NOTHING;


-- Seed data for banners
INSERT INTO banners (id, title, description, image, ai_hint) VALUES
('banner_1', 'Verano Radiante', 'Descubre nuestros productos estrella para un look fresco y luminoso esta temporada.', 'https://placehold.co/1200x600.png', 'summer cosmetics'),
('banner_2', 'Cuidado Esencial', 'Todo lo que tu piel necesita para sentirse hidratada y protegida cada día.', 'https://placehold.co/1200x600.png', 'skincare routine'),
('banner_3', 'Ofertas Imperdibles', 'Aprovecha descuentos de hasta el 20% en productos seleccionados. ¡Solo por tiempo limitado!', 'https://placehold.co/1200x600.png', 'sale makeup')
ON CONFLICT (id) DO NOTHING;
