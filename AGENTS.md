<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Tenant isolation (RLS convention)

No Postgres row-level security exists in this project — isolation is enforced entirely in application code via a `tenantId` column on every tenant-scoped model. Until real DB-level RLS is introduced (a separate, deliberate infra decision), every new table and every route touching it must follow this rule:

1. **New table**: add a `tenantId String` FK to `Tenant`, and `@@unique([tenantId, ...])` instead of a bare `@unique` for any per-tenant sequential/unique field.
2. **Reads**: always filter by `tenantId` (use `lib/scope.ts`'s `tenantScope(session)` in the `where`).
3. **Writes that reference another table's ID from the request (body or params)**: verify that foreign ID belongs to `session.tenantId` with a `findFirst({ where: { id, tenantId: session.tenantId!, deletedAt: null } })` check *before* using it in a `create`/`update`/`connect`. A tenant-scoped read on the *current* record is not enough if the payload also carries a foreign-key ID into another table (patientId, doctorId, packageId, etc.) — that ID must be independently verified. This is the exact bug class fixed on 2026-07-22 in `notes`, `appointments`, and `invoices` routes.

Reference implementations: `app/api/patients/[id]/packages/route.ts`, `app/api/sessions/route.ts`.
