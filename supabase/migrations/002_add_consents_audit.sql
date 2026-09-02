-- MahaSetu Supabase Database Schema Migration 002
-- Description: Updates profile_fields schema and adds consents and audit_log tables

-- 1. Update profile_fields table
-- Rename existing columns to match the new schema structure requested
ALTER TABLE public.profile_fields RENAME COLUMN field_category TO section;
ALTER TABLE public.profile_fields RENAME COLUMN field_name TO field_key;

-- Add new columns
ALTER TABLE public.profile_fields ADD COLUMN sensitivity TEXT DEFAULT 'normal';
ALTER TABLE public.profile_fields ADD COLUMN source TEXT DEFAULT 'manual';

-- Re-create index on renamed column
DROP INDEX IF EXISTS public.idx_profile_fields_field_name;
CREATE INDEX IF NOT EXISTS idx_profile_fields_field_key ON public.profile_fields(user_id, field_key);

-- ---------------------------------------------------------------------
-- 2. Consents Table
-- Stores explicit consent grants per site for specific fields
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    site_origin TEXT NOT NULL,
    purpose TEXT NOT NULL,
    field_keys TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'revoked', 'expired'
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_user_site ON public.consents(user_id, site_origin);

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents"
    ON public.consents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
    ON public.consents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consents"
    ON public.consents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE TRIGGER update_consents_updated_at
    BEFORE UPDATE ON public.consents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------
-- 3. Audit Log Table
-- Immutable log of all sensitive field access, modifications, and autofills
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'filled', 'declined', 'format_mismatch', 'consent_granted', 'consent_revoked', 'field_saved'
    site_origin TEXT,
    field_key TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
    ON public.audit_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs"
    ON public.audit_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Intentionally no UPDATE or DELETE policies for audit_log to keep it immutable by users
