-- ============================================================
-- Migration: Fix RLS policies and add team invite support
-- ============================================================

-- ── 1. Fix tip_settings RLS (add WITH CHECK for INSERT) ──────
DROP POLICY IF EXISTS "Users can manage tip settings" ON public.tip_settings;

CREATE POLICY "Users can manage tip settings"
  ON public.tip_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 2. Fix team_members RLS (add WITH CHECK for INSERT) ──────
DROP POLICY IF EXISTS "Owners can manage team members" ON public.team_members;

CREATE POLICY "Owners can manage team members"
  ON public.team_members
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
