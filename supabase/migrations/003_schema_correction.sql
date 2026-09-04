-- Migration: 003_schema_correction.sql
-- Correcting drift between live DB and migrations, enforcing zero-knowledge PII rules.

-- 1. Document `user_id` -> `id` rename on `profiles`.
-- The column `user_id` was renamed to `id` (referencing auth.users(id)).
-- This DO block ensures idempotency if running on a fresh db where it might already be named `id`,
-- or an old db where it's still `user_id`.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_id') THEN
    ALTER TABLE profiles RENAME COLUMN user_id TO id;
  END IF;
END $$;

-- 2. Drop plaintext PII columns from `profiles`.
-- All sensitive fields must live exclusively in `profile_fields` as ciphertext.
DO $$
BEGIN
  ALTER TABLE profiles DROP COLUMN IF EXISTS full_name;
  ALTER TABLE profiles DROP COLUMN IF EXISTS dob;
  ALTER TABLE profiles DROP COLUMN IF EXISTS aadhaar_number;
  ALTER TABLE profiles DROP COLUMN IF EXISTS mobile;
  ALTER TABLE profiles DROP COLUMN IF EXISTS address;
END $$;

-- 3. Drop unused/duplicate table `profile_fields_metadata`
DROP TABLE IF EXISTS profile_fields_metadata CASCADE;

-- 4. Enforce NOT NULL on key_derivation_salt
DO $$
BEGIN
  ALTER TABLE profiles ALTER COLUMN key_derivation_salt SET NOT NULL;
END $$;
