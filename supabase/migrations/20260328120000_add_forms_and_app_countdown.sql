-- ============================================================
-- Migration: Form Builder + App Launch Countdown
-- This script is idempotent and safe to re-run
-- ============================================================

-- ── 1. Forms table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Form',
  description text,
  category text DEFAULT 'general',
  status text DEFAULT 'draft',
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  thank_you_message text DEFAULT 'Thank you for your submission!',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own forms"
    ON public.forms FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Published forms are publicly readable"
    ON public.forms FOR SELECT TO anon
    USING (status = 'published' AND is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Form fields table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  field_type text NOT NULL,
  label text NOT NULL,
  placeholder text,
  help_text text,
  is_required boolean DEFAULT false,
  options jsonb DEFAULT '[]',
  validation jsonb DEFAULT '{}',
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage fields of own forms"
    ON public.form_fields FOR ALL TO authenticated
    USING (form_id IN (SELECT id FROM public.forms WHERE user_id = auth.uid()))
    WITH CHECK (form_id IN (SELECT id FROM public.forms WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Published form fields are publicly readable"
    ON public.form_fields FOR SELECT TO anon
    USING (form_id IN (SELECT id FROM public.forms WHERE status = 'published' AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. Form submissions table ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  responses jsonb NOT NULL DEFAULT '{}',
  submitter_email text,
  submitter_name text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Form owners can view submissions"
    ON public.form_submissions FOR SELECT TO authenticated
    USING (form_id IN (SELECT id FROM public.forms WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can submit to published forms"
    ON public.form_submissions FOR INSERT TO anon, authenticated
    WITH CHECK (form_id IN (SELECT id FROM public.forms WHERE status = 'published' AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 4. Site settings table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Site settings are publicly readable"
    ON public.site_settings FOR SELECT TO anon, authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update site settings"
    ON public.site_settings FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO public.site_settings (key, value) VALUES
  ('app_launch_date', '{"date": "2026-09-01T00:00:00Z", "ios_enabled": true, "android_enabled": true}')
ON CONFLICT (key) DO NOTHING;
