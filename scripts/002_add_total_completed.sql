-- Add total_completed_pomodoros to user_settings to track total pomodoros completed by a user
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS total_completed_pomodoros INTEGER DEFAULT 0;

-- Allow updating and selecting the new column via RLS by extending existing policies
-- (Assumes policies using auth.uid() already in place; no change required if user_id matching is done by id)

-- Note: After running this migration, consider backfilling existing totals from pomodoro_sessions if desired.
-- Example backfill (optional):
-- UPDATE public.user_settings us
-- SET total_completed_pomodoros = COALESCE(sub.count, 0)
-- FROM (
--   SELECT user_id, COUNT(*) AS count
--   FROM public.pomodoro_sessions
--   WHERE session_type = 'work'
--   GROUP BY user_id
-- ) sub
-- WHERE us.id = sub.user_id;
