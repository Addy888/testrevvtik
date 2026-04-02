-- Fix onboarding company insert fallback:
-- ensure companies.is_active exists for payloads that include it.
ALTER TABLE IF EXISTS public.companies
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

