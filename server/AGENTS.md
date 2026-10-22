# Backend boundaries

Root rules apply. The frontend modularization does not authorize database or backend behavior changes.

- Extend the existing owning module. Keep validation/auth at the HTTP boundary, orchestration in services and persistence in repositories where applicable.
- Enforce ownership/private-data access server-side. Preserve transaction and idempotency guarantees.
- Do not import frontend implementation files. API contracts must be documented and validated.
- Do not apply migrations, alter environment files, seed real databases or broaden access as incidental work. Establish explicit environment/scope before database changes.
- Run server build and meaningful service/HTTP tests for behavior changes. Test fixtures must not access the configured real database.
