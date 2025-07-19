-- 1. Create the public users table
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NULL,
  role text NULL DEFAULT 'cajero'::text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for the users table
-- This policy allows authenticated users to read all user data.
-- You might want to restrict this further, e.g., only allow admins to read all users.
CREATE POLICY "Allow authenticated users to read users" ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- This policy allows admin users to update user roles.
CREATE POLICY "Allow admins to update user roles" ON public.users
  FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'::text)
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'::text);
  
-- This policy allows admin users to delete users.
CREATE POLICY "Allow admins to delete users" ON public.users
  FOR DELETE
  TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'::text);


-- 4. Create a function to copy new users from auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Create a trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- (Optional but Recommended) One-time script to backfill existing users
-- Run this once to populate your public.users table with any users that already existed in auth.users
INSERT INTO public.users (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;
