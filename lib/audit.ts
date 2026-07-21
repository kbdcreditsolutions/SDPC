import { Prisma, PrismaClient } from "@prisma/client";

type AuditableClient = Prisma.TransactionClient | PrismaClient;

export async function logAudit(
  db: AuditableClient,
  params: {
    tenantId: string | null;
    actorId: string;
    action: "CREATE" | "UPDATE" | "DELETE";
    entity: string;
    entityId: string;
    diff?: Record<string, unknown>;
  }
) {
  await db.auditLog.create({
    data: {
      tenantId: params.tenantId,
      actorId: params.actorId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      diff: params.diff as Prisma.InputJsonValue | undefined,
    },
  });
}
