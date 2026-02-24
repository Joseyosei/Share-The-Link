-- Ensure the unique constraint exists for user_integrations upsert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_integrations_user_id_integration_id_key'
  ) THEN
    ALTER TABLE public.user_integrations ADD CONSTRAINT user_integrations_user_id_integration_id_key UNIQUE (user_id, integration_id);
  END IF;
END $$;
