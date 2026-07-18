import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;
  const { id } = await params;
  const scope = tenantScope(session);

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.packageSession.findFirst({ where: { id, ...scope, deletedAt: null } });
      if (!existing) throw new Error("NOT_FOUND");

      // Conditional on deletedAt: null so a concurrent double-click ("Undo" clicked
      // twice, or two admins undoing the same session) only lets one request through —
      // the loser's count is 0 and it skips the decrement below, avoiding a negative count.
      const claim = await tx.packageSession.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (claim.count === 0) throw new Error("ALREADY_UNDONE");

      await tx.package.update({
        where: { id: existing.packageId },
        data: { usedSessions: { decrement: 1 } },
      });
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to undo session" }, { status: 400 });
  }
}
