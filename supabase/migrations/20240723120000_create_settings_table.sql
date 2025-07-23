-- Create the settings table to hold global configuration for the store.
CREATE TABLE IF NOT EXISTS public.settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    tax_rate REAL NOT NULL DEFAULT 0.15,
    shipping_local_cost REAL NOT NULL DEFAULT 50.00,
    shipping_national_cost REAL NOT NULL DEFAULT 150.00,
    pickup_address TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT settings_singleton CHECK (id = 1)
);

-- Apply row-level security to the table.
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access to the settings.
CREATE POLICY "Allow public read-only access"
ON public.settings
FOR SELECT
TO public
USING (true);

-- Allow admins to update the settings.
CREATE POLICY "Allow admin update access"
ON public.settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert the default settings row if it doesn't exist.
INSERT INTO public.settings (id, tax_rate, shipping_local_cost, shipping_national_cost, pickup_address, logo_url)
VALUES (1, 0.15, 50.00, 150.00, 'Col. Las Hadas, Boulevard Morazán, frente a Automall, Tegucigalpa, Honduras', 'https://placehold.co/200x80.png?text=BEM+STORE')
ON CONFLICT (id) DO NOTHING;
