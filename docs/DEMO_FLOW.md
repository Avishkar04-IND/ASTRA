# Demo Flow

## Scenario

A citizen applies on a mock government portal using MahaSetu to share already authorized profile data and mock documents.

## Steps

1. Citizen signs in to the citizen dashboard.
2. Citizen reviews profile fields and mock documents.
3. Citizen opens the mock government portal.
4. Chrome extension detects form fields.
5. Extension maps labels to canonical field keys such as `full_name`, `dob`, `mobile`, and `annual_income`.
6. Extension asks for consent with purpose and requested fields.
7. Citizen approves.
8. Extension retrieves authorized mock data from Supabase.
9. Extension autofills the mock portal form.
10. Supabase records consent and audit events.
11. Mock portal submits a simulated application.
12. Official dashboard shows the application, timeline, approval state, grievance state, and service outcome metrics.

## Mock Boundaries

- DigiLocker/API Setu data is mock or sandbox only.
- Government portal is the local mock portal.
- Department API responses are simulated.
- Application status/events are simulated.
- Grievance data is simulated.
- No real citizen identity documents are used.
