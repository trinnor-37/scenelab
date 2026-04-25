-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

-- ── PROFILES TABLE ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                  text NOT NULL DEFAULT 'free',
  trial_ends_at         timestamptz,
  stripe_customer_id    text UNIQUE,
  stripe_subscription_id text,
  subscription_status   text,
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── AUTO-CREATE PROFILE WITH 7-DAY TRIAL ON SIGNUP ──────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, plan, trial_ends_at)
  VALUES (NEW.id, 'free', NOW() + INTERVAL '7 days')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users (7-day trial from now)
INSERT INTO public.profiles (id, trial_ends_at)
SELECT id, NOW() + INTERVAL '7 days'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ── USAGE COUNTS TABLE ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usage_counts (
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date NOT NULL DEFAULT CURRENT_DATE,
  concepts   integer NOT NULL DEFAULT 0,
  voiceover  integer NOT NULL DEFAULT 0,
  variations integer NOT NULL DEFAULT 0,
  pipeline   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE public.usage_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own usage" ON public.usage_counts
  FOR ALL USING (auth.uid() = user_id);
