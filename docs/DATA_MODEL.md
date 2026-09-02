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

Citizen or official identity record. Stores account identity, role, contact fields, and timestamps. Aadhaar values in the MVP must be synthetic only.

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
