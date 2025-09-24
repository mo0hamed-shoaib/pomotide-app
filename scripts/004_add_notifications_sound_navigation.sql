-- Add missing preference columns to user_settings for logged-in users

ALTER TABLE IF EXISTS public.user_settings
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sound_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_start_on_navigation boolean DEFAULT true;

-- No RLS policy changes needed since existing policies already gate by id = auth.uid()


