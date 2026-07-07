import { SessionPayload } from "@/lib/auth";

export function tenantScope(session: SessionPayload) {
  return { tenantId: session.tenantId! };
}
