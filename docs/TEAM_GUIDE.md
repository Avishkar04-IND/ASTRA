# Team Guide

Team: ASTRA

Goal: keep the MVP parallelizable for five developers while preserving one shared source of truth.

## Developer A - Chrome Extension Core

Owns:

- `extension/manifest.json`
- `extension/background/`
- extension authentication/session handling
- extension build configuration

Coordinates on:

- `shared/types/`
- `shared/constants/fieldKeys.ts`
- extension-to-Supabase contract in `docs/API_CONTRACTS.md`

## Developer B - Field Detection / Semantic Mapping

Owns:

- `extension/content-scripts/`
- form scanning
- semantic mapping pipeline
- validation before autofill

Matching approach:

1. normalization
2. synonym dictionary
3. fuzzy matching
4. format validation
5. optional LLM fallback

Coordinates on:

- `shared/constants/fieldKeys.ts`
- `shared/schemas/fieldSchemas.ts`
- `FieldMapping` in `shared/types/index.ts`

## Developer C - Supabase Backend / Auth / Database

Owns:

- `supabase/migrations/`
- `supabase/seed/`
- auth/RLS policies
- database schema and seed data

Coordinates on:

- all shared entities in `shared/types/index.ts`
- audit and consent contracts in `docs/API_CONTRACTS.md`

## Developer D - Citizen + Official Dashboards

Owns:

- `dashboard/citizen/`
- `dashboard/official/`
- profile, documents, consent, applications, grievances, official review views

Coordinates on:

- `shared/types/`
- `shared/constants/fieldKeys.ts`
- dashboard-to-Supabase contract in `docs/API_CONTRACTS.md`

## Developer E - Mock Government Portal / Integration / Testing

Owns:

- `mock-portal/`
- demo scenarios
- integration test data
- end-to-end demo validation

Coordinates on:

- extension-to-mock-portal contract
- `docs/DEMO_FLOW.md`
- mock application, approval, grievance, and department data

## Shared Files Requiring Coordination

Changes to these files should be discussed before merging:

- `shared/types/index.ts`
- `shared/constants/fieldKeys.ts`
- `shared/schemas/fieldSchemas.ts`
- `docs/API_CONTRACTS.md`
- `docs/DATA_MODEL.md`
- `supabase/migrations/`

## Working Rules

- Do not add production government APIs or credentials.
- Do not use real Aadhaar/PAN values or real citizen documents.
- Keep mock and sandbox integrations clearly labeled.
- Prefer shared entity names over module-specific naming.
- Add only MVP-critical abstractions before the hackathon demo.
