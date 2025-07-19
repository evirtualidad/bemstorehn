-- This script should be idempotent, meaning it can be run multiple times without causing errors.

-- 1. Create PRODUCTS table
-- Stores all product information.
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
-- This table is safe to expose to the client-side app.
-- It will be populated automatically by a trigger when a new user signs up in Supabase Auth.
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'admin' -- New users will default to 'admin' role.
);

-- 3. Create function to sync new auth users to our public.users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserts a new row into public.users, capturing the id and email from the auth.users table.
  -- The 'role' will use the DEFAULT value specified in the 'users' table definition ('admin').
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to call the function on new user sign-up
-- This ensures that whenever a user is created in Supabase's authentication system,
-- our handle_new_user function runs, creating a corresponding profile in public.users.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5. Set up Storage Bucket for product images
-- Creates the 'product-images' bucket if it doesn't already exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Set up Storage Policies for the 'product-images' bucket
-- These policies define who can do what with the files in the bucket.

-- Policy to allow anonymous read access to images (so anyone can see product photos)
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'product-images');

-- Policy to allow logged-in (authenticated) users to upload images
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Policy to allow logged-in (authenticated) users to delete images
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');


-- 7. Configure Row Level Security (RLS) for the 'users' table
-- This is crucial for fixing the "infinite recursion" error.

-- First, ensure RLS is enabled on the table.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop any potentially conflicting old policies to start fresh.
DROP POLICY IF EXISTS "Allow public read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create a new, simple policy: ANY authenticated user can read ALL profiles.
-- This is appropriate and secure for an internal admin/employee-facing application
-- and avoids the recursion error by not re-checking the same table.
CREATE POLICY "Enable read access for all users"
ON public.users
FOR SELECT
TO authenticated
USING (true);
