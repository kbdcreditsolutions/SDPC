-- Postgres Row-Level Security for tenant isolation.
-- Not managed by Prisma (no policy/RLS primitives in schema.prisma) — applied directly via scripts/apply-rls.ts.
-- Session identity is set per-request via set_config('app.tenant_id', ...) — see lib/tenantPrisma.ts.
--
-- Scope: every table with a direct tenantId column, except "User" (login must look up a user by
-- email before any tenant is known — see lib/guard.ts requireSession, which intentionally does not
-- scope User through this mechanism). Three tables with no tenantId column but a tenant-scoped
-- parent FK get a subquery-based policy instead.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Branch', 'Patient', 'Package', 'PackageSession', 'Invoice',
    'Appointment', 'AttendanceRecord', 'Campaign', 'Referral', 'Rating'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING ("tenantId" = current_setting(''app.tenant_id'', true))',
      t
    );
  END LOOP;

  -- AuditLog.tenantId is nullable (some system/cross-tenant events have no
  -- tenant), so the plain-equality policy used above would permanently hide
  -- those rows once FORCE ROW LEVEL SECURITY is on. Allow NULL through too.
  ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS tenant_isolation ON "AuditLog";
  CREATE POLICY tenant_isolation ON "AuditLog"
    USING ("tenantId" = current_setting('app.tenant_id', true) OR "tenantId" IS NULL);

  -- Transitively-scoped tables (no tenantId column of their own)
  ALTER TABLE "InvoiceLineItem" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "InvoiceLineItem" FORCE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS tenant_isolation ON "InvoiceLineItem";
  CREATE POLICY tenant_isolation ON "InvoiceLineItem"
    USING ("invoiceId" IN (SELECT id FROM "Invoice" WHERE "tenantId" = current_setting('app.tenant_id', true)));

  ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "Payment" FORCE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS tenant_isolation ON "Payment";
  CREATE POLICY tenant_isolation ON "Payment"
    USING ("invoiceId" IN (SELECT id FROM "Invoice" WHERE "tenantId" = current_setting('app.tenant_id', true)));

  ALTER TABLE "ClinicalNote" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "ClinicalNote" FORCE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS tenant_isolation ON "ClinicalNote";
  CREATE POLICY tenant_isolation ON "ClinicalNote"
    USING ("patientId" IN (SELECT id FROM "Patient" WHERE "tenantId" = current_setting('app.tenant_id', true)));
END $$;
