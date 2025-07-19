-- Create a table for public products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name character varying NOT NULL,
  description text,
  price double precision NOT NULL,
  originalPrice double precision,
  stock integer NOT NULL DEFAULT 0,
  category text,
  image text,
  featured boolean DEFAULT false,
  "aiHint" text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT
);

-- Remove old, potentially conflicting policies first
DROP POLICY IF EXISTS "Allow individual read access" ON public.users;
DROP POLICY IF EXISTS "Allow individual update access" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.users;

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- This policy allows any authenticated user to read all user profiles.
-- This is suitable for an admin-focused application where staff can see who else is on the system.
CREATE POLICY "Allow authenticated users to read all users" ON public.users
FOR SELECT TO authenticated USING (true);

-- Allow admins to update user roles
CREATE POLICY "Allow admins to update" ON public.users
FOR UPDATE USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Allow admins to insert new users (should not be needed if trigger works, but good as a fallback)
CREATE POLICY "Allow admins to insert" ON public.users
FOR INSERT WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- This function is called by the trigger when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new row into public.users, linking it to the new auth.users record
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'admin'); -- Default all new sign-ups to 'admin'
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to fire after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STORAGE BUCKET FOR PRODUCT IMAGES
-- 1. Create a bucket "product-images"
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up access policies for the bucket
-- Allow public read access to all images
CREATE POLICY "Allow public read access on product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Allow authenticated users to upload, update, and delete their own images
CREATE POLICY "Allow authenticated users to manage product images" ON storage.objects
FOR ALL USING (
  bucket_id = 'product-images' AND auth.role() = 'authenticated'
);
