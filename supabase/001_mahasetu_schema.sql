-- MahaSetu Supabase Database Schema
-- Version: 001
-- Description: Zero-Knowledge encrypted identity profile vault tables and RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Profiles Table
-- Stores user account info and PBKDF2 salt for key derivation
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    key_derivation_salt TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2. Profile Fields Table
-- Stores encrypted user fields (Aadhaar, PAN, Phone, etc.)
-- Ciphertext and IV stored; server NEVER sees plaintext key or data
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_category TEXT DEFAULT 'general',
    field_value_ciphertext TEXT NOT NULL,
    field_value_iv TEXT NOT NULL,
    format_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_profile_fields_user_id ON public.profile_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_fields_field_name ON public.profile_fields(user_id, field_name);

-- ---------------------------------------------------------------------
-- 3. Row Level Security (RLS) Policies
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_fields ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Profile Fields RLS Policies
CREATE POLICY "Users can view own profile fields"
    ON public.profile_fields FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile fields"
    ON public.profile_fields FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile fields"
    ON public.profile_fields FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile fields"
    ON public.profile_fields FOR DELETE
    USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 4. Updated At Triggers
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_profile_fields_updated_at
    BEFORE UPDATE ON public.profile_fields
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
