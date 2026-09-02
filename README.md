# MahaSetu

Team: ASTRA

MahaSetu is a citizen-side interoperability assistant for government portals. It does not replace existing government systems. For the hackathon MVP, MahaSetu acts as a citizen-facing orchestration and interface layer that coordinates consent, mock/sandbox data retrieval, field mapping, autofill, unified application tracking, and official dashboards.

## Repository Structure

```text
dashboard/
  citizen/       Existing citizen dashboard app
  official/      Prepared official dashboard module
extension/       Chrome extension app, background worker, and content scripts
mock-portal/     Mock government portal for demo and integration tests
shared/          Canonical types, field keys, schemas, and shared notes
supabase/
  migrations/    Database migrations
  seed/          Synthetic seed data only
docs/            Architecture, contracts, team guide, and demo flow
```

## Prototype Boundary

The MVP must use mock or sandbox integrations only for DigiLocker, API Setu, government portals, government department APIs, application status/events, and grievance data. Do not use real Aadhaar/PAN data, real citizen documents, production credentials, or production government APIs.

## Development

Install and run each app from its own folder:

```bash
cd dashboard/citizen && npm install && npm run dev
cd extension && npm install && npm run dev
cd mock-portal && npm install && npm run dev
```

Current deployment has been intentionally disabled while the architecture is being rebuilt.
