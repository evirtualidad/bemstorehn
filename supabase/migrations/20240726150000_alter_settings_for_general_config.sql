-- Add new columns for general settings to the existing 'settings' table.
-- We use ALTER TABLE to avoid creating a new table and keep all settings centralized.

-- Add tax_rate column with a default of 0.15 (15%)
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS tax_rate real NOT NULL DEFAULT 0.15;

-- Add shipping_local_cost column with a default of 50
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS shipping_local_cost real NOT NULL DEFAULT 50;

-- Add shipping_national_cost with a default of 150
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS shipping_national_cost real NOT NULL DEFAULT 150;

-- Add pickup_address column with a default address
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS pickup_address text NOT NULL DEFAULT 'Col. Las Hadas, Boulevard Morazán, frente a Automall, Tegucigalpa, Honduras';

-- Ensure the existing row (id=1) has the default values set for the new columns.
-- This prevents issues if the row already exists but the new columns are NULL.
UPDATE public.settings
SET 
  tax_rate = COALESCE(tax_rate, 0.15),
  shipping_local_cost = COALESCE(shipping_local_cost, 50),
  shipping_national_cost = COALESCE(shipping_national_cost, 150),
  pickup_address = COALESCE(pickup_address, 'Col. Las Hadas, Boulevard Morazán, frente a Automall, Tegucigalpa, Honduras')
WHERE id = 1;
