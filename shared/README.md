# MahaSetu Shared Source of Truth

This folder contains the shared contracts that every module must import or mirror.

- `constants/fieldKeys.ts` defines the canonical field keys. Do not invent alternate names such as `aadhaarNo`, `phone_number`, or `income`.
- `types/index.ts` defines the common entities used across dashboards, extension, mock portal, and Supabase.
- `schemas/fieldSchemas.ts` defines field metadata used by mapping, validation, consent display, and mock data.

Initial semantic matching flow:

1. Normalize form labels and input names.
2. Match against the canonical field key list.
3. Match known synonyms.
4. Apply fuzzy matching with a confidence threshold.
5. Validate the value format before autofill.
6. Use an optional LLM fallback only when deterministic matching is inconclusive.

Prototype boundary: Aadhaar, DigiLocker, API Setu, government APIs, application events, and grievances must use mock or sandbox data only.
