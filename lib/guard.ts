import { NextResponse } from "next/server";
import { getSession, Role } from "@/lib/auth";
import { withTenant, TenantPrisma } from "@/lib/tenantPrisma";

export async function requireSession(allowedRoles?: Role[]) {
  const session = await getSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), db: null as TenantPrisma | null };
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { session: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }), db: null as TenantPrisma | null };
  }
  const db = session.tenantId ? withTenant(session.tenantId) : null;
  return { session, response: null, db };
}
