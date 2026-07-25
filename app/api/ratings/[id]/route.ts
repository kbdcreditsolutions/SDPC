import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { setTenantContext } from "@/lib/tenantPrisma";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response, db } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;
  const { id } = await params;
  const scope = tenantScope(session);

  const existing = await db!.rating.findFirst({ where: { id, ...scope, deletedAt: null } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await setTenantContext(tx, session.tenantId!);
    const deleted = await tx.rating.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await logAudit(tx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "DELETE",
      entity: "Rating",
      entityId: deleted.id,
      diff: { doctorId: deleted.doctorId, type: deleted.type },
    });
  });

  return NextResponse.json({ success: true });
}
