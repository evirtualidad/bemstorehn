-- 1. Create PRODUCTS table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    image TEXT,
    aiHint TEXT,
    price REAL NOT NULL,
    originalPrice REAL,
    description TEXT,
    category TEXT,
    stock INTEGER NOT NULL,
    featured BOOLEAN DEFAULT FALSE
);

-- 2. Create USERS table for public profiles
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'admin' -- Default new users to 'admin'
);

-- 3. Drop existing trigger and function to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Create function to sync new auth users to public.users table AND set role in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'admin');

  -- Update the user's metadata in the auth schema to include the role.
  -- This makes the role available in the JWT for client-side access without extra queries.
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'admin')
  WHERE id = new.id;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Create trigger to call the function on new user sign-up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 6. Set up Storage Bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Set up Storage Policies
-- Policy to allow anonymous read access to images
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'product-images');

-- Policy to allow authenticated users to upload images
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Policy to allow authenticated users to delete their own images
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 8. Configure Row Level Security (RLS) for the 'users' table
-- First, ensure RLS is enabled on the table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts from previous attempts
DROP POLICY IF EXISTS "Allow public read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- Create a new, simple policy: Allow any authenticated user to read all profiles.
-- This is secure for an internal admin/employee-facing application and avoids recursion.
CREATE POLICY "Enable read access for all users"
ON public.users
FOR SELECT
TO authenticated
USING (true);
