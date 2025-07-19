-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  role TEXT
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to the users table
CREATE POLICY "Allow public read access to users"
ON public.users
FOR SELECT
USING (true);

-- Allow individual users to update their own profile
CREATE POLICY "Allow individual user update access"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- Allow admins to do anything
CREATE POLICY "Allow admin all access"
ON public.users
FOR ALL
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'cajero'); -- Default role is 'cajero'
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger to call the function on new user sign-up
-- Drop trigger first to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Create the products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    image TEXT,
    aiHint TEXT,
    price REAL NOT NULL,
    originalPrice REAL,
    description TEXT,
    category TEXT NOT NULL,
    stock INTEGER NOT NULL,
    featured BOOLEAN DEFAULT false
);


-- Create a bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the product-images bucket
-- Policy for public read access
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Policy for authenticated users to upload
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' );

-- Policy for users to update their own images
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( auth.uid() = owner );

-- Policy for users to delete their own images
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( auth.uid() = owner );

-- RLS for products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products are viewable by everyone." ON public.products;
CREATE POLICY "Products are viewable by everyone."
ON public.products FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Admins can insert products." ON public.products;
CREATE POLICY "Admins can insert products."
ON public.products FOR INSERT
TO authenticated
WITH CHECK ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Admins can update products." ON public.products;
CREATE POLICY "Admins can update products."
ON public.products FOR UPDATE
TO authenticated
USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Admins can delete products." ON public.products;
CREATE POLICY "Admins can delete products."
ON public.products FOR DELETE
TO authenticated
USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );


-- Functions for stock management
CREATE OR REPLACE FUNCTION decrease_stock(product_id UUID, quantity_to_decrease INT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET stock = stock - quantity_to_decrease
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increase_stock(product_id UUID, quantity_to_increase INT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET stock = stock + quantity_to_increase
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;
