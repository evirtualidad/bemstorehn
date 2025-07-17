
-- Habilitar la extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Crear la tabla de categorías
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear la tabla de productos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    originalPrice NUMERIC,
    image TEXT,
    aiHint TEXT,
    stock INT NOT NULL DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear la tabla de banners
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    aiHint TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear la tabla de clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    address JSONB,
    total_spent NUMERIC NOT NULL DEFAULT 0,
    order_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear la tabla de pedidos
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    display_id TEXT UNIQUE NOT NULL DEFAULT concat('ORD-', substr(replace(extensions.uuid_generate_v4()::text, '-', ''), 1, 6)),
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT,
    customer_phone TEXT,
    customer_address JSONB,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    shipping_cost NUMERIC,
    balance NUMERIC NOT NULL DEFAULT 0,
    payments JSONB DEFAULT '[]'::jsonb,
    payment_method TEXT,
    payment_reference TEXT,
    payment_due_date TIMESTAMPTZ,
    status TEXT NOT NULL,
    source TEXT NOT NULL,
    delivery_method TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configurar Políticas de Seguridad a Nivel de Fila (RLS)
-- Habilitar RLS para todas las tablas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso público de LECTURA (SELECT)
DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read products" ON public.products;
CREATE POLICY "Public can read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read banners" ON public.banners;
CREATE POLICY "Public can read banners" ON public.banners FOR SELECT USING (true);

-- Políticas para que los usuarios autenticados puedan gestionar la información
-- Cualquiera autenticado puede gestionar las tablas
DROP POLICY IF EXISTS "Authenticated users can manage data" ON public.categories;
CREATE POLICY "Authenticated users can manage data" ON public.categories FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage data" ON public.products;
CREATE POLICY "Authenticated users can manage data" ON public.products FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage data" ON public.banners;
CREATE POLICY "Authenticated users can manage data" ON public.banners FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage data" ON public.orders;
CREATE POLICY "Authenticated users can manage data" ON public.orders FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage data" ON public.customers;
CREATE POLICY "Authenticated users can manage data" ON public.customers FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');


-- Insertar datos de ejemplo
-- Insertar categorías
INSERT INTO public.categories (name, label) VALUES
('Skincare', 'Cuidado de la Piel'),
('Makeup', 'Maquillaje'),
('Haircare', 'Cuidado del Cabello')
ON CONFLICT (name) DO NOTHING;

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
