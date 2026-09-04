# MahaSetu Data Model

Shared TypeScript definitions live in `shared/types/index.ts`. Canonical form field keys live in `shared/constants/fieldKeys.ts`.

## Canonical Field Keys

- `full_name`
- `dob`
- `aadhaar_number`
- `mobile`
- `address`
- `annual_income`
- `college_name`
- `marks_percentage`

These names must be used consistently across dashboard forms, extension field mapping, Supabase rows, mock portal payloads, consent records, and audit logs.

## Core Entities

## UserProfile

Account identity record linked to Supabase Auth. Stores `id`, `email`, the key-derivation salt, and timestamps.
**IMPORTANT**: `profiles` never holds plaintext PII. Columns like `full_name`, `dob`, `aadhaar_number`, `mobile`, and `address` have been removed. All sensitive field values live exclusively in `profile_fields` as ciphertext.

## profile_fields

Stores encrypted sensitive data for citizens.
Columns: `id`, `user_id` (references `profiles(id)`), `section`, `field_key`, `field_value_ciphertext`, `field_value_iv`, `format_type`, `sensitivity`, `source`, `created_at`, `updated_at`.

## Document

Metadata for citizen documents. Sources are `manual`, `digilocker_mock`, or `api_setu_sandbox`. Do not store real citizen documents in the MVP.

## Consent

Field-scoped and document-scoped authorization grant. Includes purpose, requester, status, expiry, revocation timestamp, and requested field keys.

## Application

Unified application tracking record linked to a citizen, department, and service. Status and timeline events are mock data in the MVP.

## ApplicationEvent / TimelineEvent

Timeline record for application changes, notifications, official decisions, and exception states.

## Grievance

Citizen grievance linked optionally to an application or department. MVP grievance data is simulated.

## Department

Master data for departments participating in the demo.

## Service

Master data for services and their required fields/documents.

## Approval

Official review action for an application. MVP approval state is simulated.

## AuditLog

Immutable record of consent, access, autofill, validation, and workflow actions.

## FieldMapping

Mapping between an external form field and one canonical `FieldKey`. Matching strategy is one of normalization, synonym, fuzzy, format validation, or optional LLM fallback.
