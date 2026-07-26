import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { logAudit } from "@/lib/audit";
import { setTenantContext } from "@/lib/tenantPrisma";
import { z } from "zod";
import { zodErrorMessage } from "@/lib/zodError";

const patchSchema = z.object({
  doctorId: z.string().optional(),
  date: z.coerce
    .date()
    .refine(
      (d) => {
        const maxAllowed = new Date();
        maxAllowed.setUTCDate(maxAllowed.getUTCDate() + 1);
        return d <= maxAllowed;
      },
      { message: "Session date cannot be in the future" }
    )
    .optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response, db } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;
  const { id } = await params;
  const scope = tenantScope(session);

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });

  const existing = await db!.packageSession.findFirst({ where: { id, ...scope, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.doctorId) {
    const doctor = await db!.user.findFirst({
      where: { id: parsed.data.doctorId, ...scope, role: "DOCTOR", isActive: true, deletedAt: null },
    });
    if (!doctor) return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.doctorId !== undefined) data.doctorId = parsed.data.doctorId || null;
  if (parsed.data.date !== undefined) data.date = parsed.data.date;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await setTenantContext(tx, session.tenantId!);
      const result = await tx.packageSession.update({
        where: { id },
        data,
        include: {
          patient: { select: { id: true, name: true } },
          doctor: { select: { id: true, name: true, specialty: true } },
          package: { select: { id: true, name: true, totalSessions: true, usedSessions: true } },
        },
      });
      await logAudit(tx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: "UPDATE",
        entity: "PackageSession",
        entityId: result.id,
        diff: {
          before: { doctorId: existing.doctorId, date: existing.date, notes: existing.notes },
          after: data,
        },
      });
      return result;
    });
    return NextResponse.json({ session: updated });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

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
      await setTenantContext(tx, session.tenantId!);
      const existing = await tx.packageSession.findFirst({
        where: { id, ...scope, deletedAt: null },
        include: { package: { select: { singleVisit: true, invoiceId: true } } },
      });
      if (!existing) throw new Error("NOT_FOUND");

      // Conditional on deletedAt: null so a concurrent double-click ("Undo" clicked
      // twice, or two admins undoing the same session) only lets one request through —
      // the loser's count is 0 and it skips the decrement below, avoiding a negative count.
      const claim = await tx.packageSession.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (claim.count === 0) throw new Error("ALREADY_UNDONE");

      if (existing.package.singleVisit) {
        // A single-visit "package" always has exactly one session — undoing it
        // undoes the whole billed visit, not just a slot on a real package, so
        // the package and its invoice get soft-deleted too (same as a package
        // refund does), instead of leaving a paid invoice with nothing behind it.
        await tx.package.update({ where: { id: existing.packageId }, data: { deletedAt: new Date() } });
        if (existing.package.invoiceId) {
          await tx.invoice.update({ where: { id: existing.package.invoiceId }, data: { deletedAt: new Date() } });
        }
        await logAudit(tx, {
          tenantId: session.tenantId,
          actorId: session.userId,
          action: "DELETE",
          entity: "Package",
          entityId: existing.packageId,
          diff: { via: "undo", singleVisit: true, patientId: existing.patientId, invoiceId: existing.package.invoiceId },
        });
      } else {
        await tx.package.update({
          where: { id: existing.packageId },
          data: { usedSessions: { decrement: 1 } },
        });
      }

      // Undo is a one-tap primary action on the Today screen: reversing a paid
      // session has to leave a trace in the activity log, same as logging it does.
      await logAudit(tx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: "DELETE",
        entity: "PackageSession",
        entityId: existing.id,
        diff: {
          patientId: existing.patientId,
          packageId: existing.packageId,
          doctorId: existing.doctorId,
          date: existing.date,
          ...(existing.package.singleVisit ? { singleVisit: true, invoiceId: existing.package.invoiceId } : {}),
        },
      });
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to undo session" }, { status: 400 });
  }
}
