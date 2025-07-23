-- Add new columns for general settings to the existing settings table
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tax_rate real NOT NULL DEFAULT 0.15;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS shipping_local_cost real NOT NULL DEFAULT 50;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS shipping_national_cost real NOT NULL DEFAULT 150;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS pickup_address text NOT NULL DEFAULT 'Col. Las Hadas, Boulevard Morazán, frente a Automall, Tegucigalpa, Honduras';

-- Ensure the existing row (for logo) has default values for the new columns
-- This handles the case where the row exists but the new columns are null before the default is applied everywhere.
UPDATE public.settings
SET 
  tax_rate = COALESCE(tax_rate, 0.15),
  shipping_local_cost = COALESCE(shipping_local_cost, 50),
  shipping_national_cost = COALESCE(shipping_national_cost, 150),
  pickup_address = COALESCE(pickup_address, 'Col. Las Hadas, Boulevard Morazán, frente a Automall, Tegucigalpa, Honduras')
WHERE id = 1;

-- If for some reason no row exists, insert one.
INSERT INTO public.settings (id, logo_url)
VALUES (1, 'https://placehold.co/200x80.png?text=BEM+STORE')
ON CONFLICT (id) DO NOTHING;
