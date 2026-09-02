# MahaSetu Architecture

## 1. Problem

Citizens repeatedly enter the same personal, academic, income, and document details across government portals. Departments often expose different forms, schemas, workflows, and status systems, which makes interoperability hard without replacing existing systems.

## 2. MahaSetu Solution

MahaSetu is a citizen-facing orchestration and interface layer for the prototype. It coordinates profile data, consent, mock document retrieval, form field mapping, autofill, unified application tracking, audit logs, and consolidated official views.

MahaSetu does not claim Supabase is the Government of India's interoperability platform. Supabase is the prototype backend used for shared state, authorization, events, and dashboards.

## 3. Citizen Side

The citizen dashboard lets users manage profile fields, mock documents, consent grants, applications, grievances, and audit history. Sensitive data access must be consent-driven and auditable.

## 4. Interoperability Layer

For the MVP, Supabase stores normalized prototype data, common entities, events, audit logs, and mock integration results. It represents the interoperability layer in the demo, not a production government exchange.

Expected responsibilities:

- API-based exchange between modules.
- Common data standards through shared field keys and entities.
- Master data for departments and services.
- Consent-based sharing.
- Event notifications and application timelines.
- Workflow orchestration for mock approvals.
- Legacy connector simulation through the mock portal.
- RBAC and audit logs.
- Data-quality checks and exception reporting.
- Consolidated monitoring dashboards.

## 5. Government/Official Side

The official dashboard gives department users a consolidated view of mock applications, beneficiaries, approvals, grievances, service outcomes, and audit indicators. It must not connect to real government systems during the hackathon.

## 6. Data Flow

```text
Citizen
  |
  v
Citizen Dashboard
  |
  v
Supabase
  ^ 
  |
Chrome Extension
  |
  v
Government Portal
```

```text
Government Portal / Department Systems
  |
  v
Interoperability Layer / Supabase
  |
  v
Official Dashboard
```

```text
DigiLocker/API Setu Sandbox
  |
  v
MahaSetu
  |
  v
Authorized document/data
  |
  v
Consent
  |
  v
Form Autofill
```

## 7. Security and Consent

Consent must be explicit, purpose-bound, field-scoped, time-bound where possible, revocable, and logged. Audit logs should capture data access, consent grants/revocations, autofill decisions, validation failures, and official workflow actions.

RBAC boundary:

- Citizens can access only their own profile, documents, consents, applications, grievances, and audit logs.
- Officials can access only department-scoped applications, approvals, grievance summaries, and operational metrics.
- Admin privileges are reserved for demo operations and must remain clearly separated.

## 8. DigiLocker/API Setu Role

DigiLocker and API Setu are mock/sandbox sources in the MVP. They demonstrate how authorized documents and data could enter MahaSetu after consent. Production integration requires official credentials, legal approval, secure token handling, and real API compliance work.

## 9. Mock vs Production Architecture

MVP mock architecture:

- Mock government portal.
- Mock DigiLocker/API Setu responses.
- Synthetic citizen profile and document data.
- Simulated application events, approvals, grievances, and department APIs.
- Supabase as prototype backend.

Production architecture would require:

- Real federated identity/SSO integration.
- Approved DigiLocker/API Setu integrations.
- Department-specific adapters and legacy connectors.
- Stronger audit, monitoring, data retention, key management, and incident response.
- Formal data standards and governance.

## 10. Future Production Architecture

Future work should introduce production-grade identity, consent registry alignment, secure document exchange, official API gateways, event bus integrations, observability, exception workflows, and department onboarding tooling. Avoid unnecessary microservices until scale or ownership boundaries demand them.
