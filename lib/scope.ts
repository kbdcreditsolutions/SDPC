import { SessionPayload } from "@/lib/auth";
import { NextResponse } from "next/server";

export function tenantScope(session: SessionPayload): { tenantId: string } {
  if (!session.tenantId) {
    throw new Error("No tenantId on session — unauthenticated or corrupted token");
  }
  return { tenantId: session.tenantId };
}

export function tenantScopeOrReject(session: SessionPayload): { tenantId: string } | { error: NextResponse } {
  if (!session.tenantId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { tenantId: session.tenantId };
}
