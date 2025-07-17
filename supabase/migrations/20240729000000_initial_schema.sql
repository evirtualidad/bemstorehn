-- Create the 'products' table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    image TEXT,
    featured BOOLEAN DEFAULT FALSE,
    ai_hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the 'categories' table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the 'banners' table
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    ai_hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a function to decrease stock
CREATE OR REPLACE FUNCTION decrease_stock(p_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET stock = stock - p_quantity
    WHERE id = p_id AND stock >= p_quantity;
END;
$$ LANGUAGE plpgsql;

-- Create a function to increase stock
CREATE OR REPLACE FUNCTION increase_stock(p_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET stock = stock + p_quantity
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read access to categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to banners" ON banners FOR SELECT USING (true);

-- For authenticated users, you might want more permissive policies
-- For example, to allow admin users to do anything.
-- This requires you to have a way to identify admins, e.g., via a custom claim or a roles table.
-- The policies below are commented out as they are examples and require a specific auth setup.
/*
CREATE POLICY "Allow all access for authenticated users" ON products
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all access for authenticated users" ON categories
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all access for authenticated users" ON banners
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
*/
