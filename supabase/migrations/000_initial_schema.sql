
-- Enable Row Level Security
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.banners enable row level security;
alter table public.orders enable row level security;
alter table public.customers enable row level security;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON public.products;

DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage categories" ON public.categories;

DROP POLICY IF EXISTS "Allow public read access to banners" ON public.banners;
DROP POLICY IF EXISTS "Allow authenticated users to manage banners" ON public.banners;

DROP POLICY IF EXISTS "Allow authenticated users to manage orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read access for specific orders" ON public.orders;

DROP POLICY IF EXISTS "Allow authenticated users to manage customers" ON public.customers;

-- Create Policies for products table
CREATE POLICY "Allow public read access to products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage products"
  ON public.products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create Policies for categories table
CREATE POLICY "Allow public read access to categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage categories"
  ON public.categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
  
-- Create Policies for banners table
CREATE POLICY "Allow public read access to banners"
  ON public.banners FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage banners"
  ON public.banners FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create Policies for orders table
CREATE POLICY "Allow authenticated users to manage orders"
  ON public.orders FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access for specific orders"
  ON public.orders FOR SELECT
  USING (true); -- This is intentionally broad for now, can be restricted later.

-- Create Policies for customers table
CREATE POLICY "Allow authenticated users to manage customers"
  ON public.customers FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- Create Storage Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('product-images', 'product-images', true, 5242880, '{"image/jpeg","image/png","image/webp"}'),
  ('banner-images', 'banner-images', true, 5242880, '{"image/jpeg","image/png","image/webp"}')
on conflict (id) do nothing;


-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to banner images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload banner images" ON storage.objects;

-- Create Policies for product-images bucket
CREATE POLICY "Allow public read access to product images"
  FOR SELECT ON storage.objects
  USING (bucket_id = 'product-images');
  
CREATE POLICY "Allow authenticated users to upload product images"
  FOR INSERT ON storage.objects
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update product images"
    FOR UPDATE ON storage.objects
    USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete product images"
    FOR DELETE ON storage.objects
    USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Create Policies for banner-images bucket
CREATE POLICY "Allow public read access to banner images"
  FOR SELECT ON storage.objects
  USING (bucket_id = 'banner-images');
  
CREATE POLICY "Allow authenticated users to upload banner images"
  FOR INSERT ON storage.objects
  WITH CHECK (bucket_id = 'banner-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update banner images"
    FOR UPDATE ON storage.objects
    USING (bucket_id = 'banner-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete banner images"
    FOR DELETE ON storage.objects
    USING (bucket_id = 'banner-images' AND auth.role() = 'authenticated');
