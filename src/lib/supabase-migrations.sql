
-- ### USERS TABLE SETUP ###
-- 1. Create the users table to store public user data
create table users (
  id uuid references auth.users not null primary key,
  email text,
  role text
);

-- 2. Create a function to automatically insert a new user into the public.users table
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'cajero'); -- Default role is 'cajero'
  return new;
end;
$$;

-- 3. Create a trigger to call the function when a new user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
  
-- 4. Disable RLS on the users table (for development simplicity)
alter table public.users disable row level security;


-- ### PRODUCTS TABLE & STOCK FUNCTIONS ###
-- 5. Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    image TEXT,
    aiHint TEXT,
    price NUMERIC NOT NULL,
    originalPrice NUMERIC,
    description TEXT,
    category TEXT,
    stock INTEGER NOT NULL,
    featured BOOLEAN DEFAULT false
);

-- 6. Enable RLS on products table and set policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to products" ON products
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert products" ON products
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update products" ON products
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete products" ON products
FOR DELETE USING (auth.role() = 'authenticated');


-- 7. Create stock management functions
CREATE OR REPLACE FUNCTION decrease_stock(product_id UUID, quantity_to_decrease INT)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET stock = stock - quantity_to_decrease
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increase_stock(product_id UUID, quantity_to_increase INT)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET stock = stock + quantity_to_increase
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;


-- ### STORAGE BUCKET & POLICIES ###
-- 8. Create a bucket for product images. Make it public for easy access.
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Add RLS policies for the product-images bucket
-- Allow anyone to view images
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Allow authenticated users to upload, update, and delete images
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update" ON storage.objects
FOR UPDATE WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
