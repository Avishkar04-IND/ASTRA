# API Contracts

These are prototype contracts between MahaSetu modules. Do not implement real government APIs yet.

## Dashboard to Supabase

Purpose: citizen and official dashboard reads/writes.

Main entities:

- `UserProfile`
- `Document`
- `Consent`
- `Application`
- `ApplicationEvent`
- `Grievance`
- `AuditLog`

Expected operations:

- Read/update citizen profile fields.
- List mock documents.
- Grant/revoke consent.
- List application timeline.
- Submit mock grievance.
- Read audit history.
- Officials read department-scoped applications, approvals, grievances, and service outcomes.

## Extension to Supabase

Purpose: retrieve authorized data and record audit events.

Flow:

1. Extension detects form fields.
2. Extension maps detected fields to canonical `FieldKey` values.
3. Extension requests user consent for requested fields.
4. Extension reads only consented data.
5. Extension writes audit events for fill, decline, mismatch, and consent actions.

No hidden autofill is allowed. Citizen consent must be visible before sharing data.

## Extension to Mock Government Portal

Purpose: demo detection and autofill against a portal that mimics existing government forms.

Contract:

- The mock portal exposes normal HTML forms.
- The extension scans labels, names, placeholders, and input formats.
- The extension fills values only after consent.
- The portal remains an external system in the demo; MahaSetu assists without replacing it.

## DigiLocker Mock/Sandbox to MahaSetu

Purpose: demonstrate authorized document/data retrieval.

Contract:

- Requests use mock citizen identity and mock consent state.
- Responses return synthetic document metadata and test payloads.
- No production DigiLocker credentials or real citizen documents are allowed.

## Government Systems to Interoperability Layer

Purpose: represent department system exchange in the prototype.

Contract:

- Department APIs are simulated.
- Master data for departments/services uses shared entity definitions.
- Application status/events are mock timeline records.
- Exceptions are represented as validation or workflow events.

## Official Dashboard to Supabase

Purpose: consolidated operational view.

Contract:

- Officials read department-scoped applications.
- Officials review mock approvals.
- Officials view mock grievances and service outcomes.
- Official actions create audit logs and timeline events.

## Error and Exception Shape

```ts
export interface MahaSetuError {
  code: string;
  message: string;
  field_key?: string;
  application_id?: string;
  retryable: boolean;
}
```

Common prototype errors:

- `CONSENT_REQUIRED`
- `CONSENT_REVOKED`
- `FIELD_MAPPING_LOW_CONFIDENCE`
- `FORMAT_VALIDATION_FAILED`
- `MOCK_SOURCE_UNAVAILABLE`
- `OFFICIAL_SCOPE_DENIED`
