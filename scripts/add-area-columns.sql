-- Add missing columns to the areas table
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS latitude text;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS longitude text;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS country text DEFAULT 'United Arab Emirates';
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS description text;
