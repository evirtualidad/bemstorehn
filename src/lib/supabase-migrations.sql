
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
  role TEXT DEFAULT 'admin'
);

-- 3. Create function to sync new auth users and set role in metadata
-- This version uses SECURITY DEFINER to ensure it has permissions to modify auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new row into public.users
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'admin');
  
  -- Update the user's metadata in auth.users to include the role
  -- This is the key step to make the role available in the JWT
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'admin')
  WHERE id = new.id;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to call the function on new user sign-up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Set up Storage Bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 6. Set up Storage Policies
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow authenticated users to delete" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- 7. Configure Row Level Security (RLS) for the 'users' table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create a new, simple policy: Allow any authenticated user to read all profiles.
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT TO authenticated USING (true);
