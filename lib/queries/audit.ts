import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

export type AuditLogRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  diff: unknown;
  timestamp: Date;
  actor: { id: string; name: string } | null;
};

export async function getAuditLog(entity?: string): Promise<AuditLogRow[]> {
  const { session, db } = await requireSession(["CLINIC_ADMIN", "SUPER_ADMIN"]);
  if (!session) return [];

  const scope = tenantScope(session);

  const rows = await db!.auditLog.findMany({
    where: {
      ...scope,
      ...(entity ? { entity } : {}),
    },
    include: {
      actor: { select: { id: true, name: true } },
    },
    orderBy: { timestamp: "desc" },
    take: 200,
  });

  return rows;
}
