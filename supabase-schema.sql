-- ============================================================
-- Where To LARP — Full Schema
-- Run this entire script in your Supabase SQL editor:
-- https://supabase.com/dashboard → SQL Editor → New query
-- ============================================================

-- 1. Users (profiles)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  password_hash TEXT,
  google_calendar_connected BOOLEAN DEFAULT FALSE,
  show_email BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LARP Plans
CREATE TABLE IF NOT EXISTS public.larp_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  spot_name TEXT NOT NULL,
  spot_neighborhood TEXT,
  spot_category TEXT,
  spot_description TEXT,
  plan_date DATE NOT NULL,
  plan_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Friendships
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 4. Plan Invites
CREATE TABLE IF NOT EXISTS public.plan_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.larp_plans(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  token UUID UNIQUE DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Migrations (safe to run on existing databases) ──────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS public_profile BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notify_invites BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notify_friends BOOLEAN DEFAULT TRUE;

-- ── Storage bucket for avatars ────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete" ON storage.objects;

CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Avatar update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
CREATE POLICY "Avatar delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');

-- ── Enable RLS ───────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.larp_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_invites ENABLE ROW LEVEL SECURITY;

-- ── Drop existing policies before recreating ─────────────────
DROP POLICY IF EXISTS "Service role full access on users" ON public.users;
DROP POLICY IF EXISTS "Service role full access on larp_plans" ON public.larp_plans;
DROP POLICY IF EXISTS "Service role full access on friendships" ON public.friendships;
DROP POLICY IF EXISTS "Service role full access on plan_invites" ON public.plan_invites;

-- ── RLS Policies (allow all — access is controlled at API layer) ─
CREATE POLICY "Allow all on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on larp_plans" ON public.larp_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on friendships" ON public.friendships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on plan_invites" ON public.plan_invites FOR ALL USING (true) WITH CHECK (true);

-- ── Table-level grants (required for anon key access) ────────
GRANT ALL ON public.users TO anon, authenticated, service_role;
GRANT ALL ON public.larp_plans TO anon, authenticated, service_role;
GRANT ALL ON public.friendships TO anon, authenticated, service_role;
GRANT ALL ON public.plan_invites TO anon, authenticated, service_role;

-- ── Sequence grants ───────────────────────────────────────────
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
