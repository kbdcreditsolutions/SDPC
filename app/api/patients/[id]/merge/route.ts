import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { setTenantContext } from "@/lib/tenantPrisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { zodErrorMessage } from "@/lib/zodError";

const schema = z.object({
  duplicateIds: z.array(z.string().min(1)).min(1),
  dryRun: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;

  const { id: canonicalId } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  const { duplicateIds, dryRun = false } = parsed.data;

  // Verify canonical belongs to this tenant.
  const canonical = await prisma.patient.findFirst({
    where: { id: canonicalId, tenantId: session.tenantId!, deletedAt: null },
  });
  if (!canonical) return NextResponse.json({ error: "Canonical patient not found" }, { status: 404 });

  // Verify all duplicates belong to this tenant and are not the canonical.
  const duplicates = await prisma.patient.findMany({
    where: {
      id: { in: duplicateIds },
      tenantId: session.tenantId!,
      deletedAt: null,
      NOT: { id: canonicalId },
    },
  });
  if (duplicates.length !== duplicateIds.length) {
    return NextResponse.json({ error: "One or more duplicate IDs not found or already deleted" }, { status: 400 });
  }

  if (dryRun) {
    const tid = session.tenantId!;
    const counts = await Promise.all(
      duplicateIds.map(async (dupId) => ({
        dupId,
        packages: await prisma.package.count({ where: { patientId: dupId, tenantId: tid, deletedAt: null } }),
        invoices: await prisma.invoice.count({ where: { patientId: dupId, tenantId: tid, deletedAt: null } }),
        sessions: await prisma.packageSession.count({ where: { patientId: dupId, tenantId: tid, deletedAt: null } }),
        appointments: await prisma.appointment.count({ where: { patientId: dupId, tenantId: tid, deletedAt: null } }),
        clinicalNotes: await prisma.clinicalNote.count({ where: { patientId: dupId, deletedAt: null } }),
        attendance: await prisma.attendanceRecord.count({ where: { patientId: dupId, tenantId: tid } }),
      }))
    );
    return NextResponse.json({ dryRun: true, canonicalId, counts });
  }

  await prisma.$transaction(
    async (tx) => {
      await setTenantContext(tx, session.tenantId!);

      const tid = session.tenantId!;

      // Accumulate fields to copy to canonical from duplicates if canonical is missing them.
      // Notes are clinical data — concatenate rather than last-write-wins.
      const fieldUpdates: Record<string, unknown> = {};
      let accumulatedNotes = canonical.notes ?? "";

      for (const dup of duplicates) {
        const dupId = dup.id;

        if (!canonical.reason && dup.reason) fieldUpdates.reason = dup.reason;
        if (!canonical.address && dup.address) fieldUpdates.address = dup.address;
        if (!canonical.age && dup.age) fieldUpdates.age = dup.age;
        if (!canonical.gender && dup.gender) fieldUpdates.gender = dup.gender;
        if (!canonical.leadSource && dup.leadSource) fieldUpdates.leadSource = dup.leadSource;
        if (!canonical.referralDoctor && dup.referralDoctor) fieldUpdates.referralDoctor = dup.referralDoctor;
        if (dup.notes && dup.notes !== accumulatedNotes) {
          accumulatedNotes = accumulatedNotes ? `${accumulatedNotes}\n${dup.notes}` : dup.notes;
        }

        // Reassign all child records — tenantId guard on every clause per AGENTS.md policy.
        await tx.package.updateMany({ where: { patientId: dupId, tenantId: tid }, data: { patientId: canonicalId } });
        await tx.packageSession.updateMany({ where: { patientId: dupId, tenantId: tid }, data: { patientId: canonicalId } });
        await tx.invoice.updateMany({ where: { patientId: dupId, tenantId: tid }, data: { patientId: canonicalId } });
        await tx.appointment.updateMany({ where: { patientId: dupId, tenantId: tid }, data: { patientId: canonicalId } });
        // ClinicalNote has no tenantId column — patientId scope is the only available guard.
        await tx.clinicalNote.updateMany({ where: { patientId: dupId }, data: { patientId: canonicalId } });

        // If canonical itself was referred by this duplicate, nullify that — can't
        // point to itself. Then remap all other patients referred by the duplicate.
        if (canonical.referredByPatientId === dupId) {
          await tx.patient.update({ where: { id: canonicalId }, data: { referredByPatientId: null } });
        }
        await tx.patient.updateMany({
          where: { referredByPatientId: dupId, NOT: { id: canonicalId } },
          data: { referredByPatientId: canonicalId },
        });

        // AttendanceRecord has @@unique([tenantId, date, patientId]) — delete conflicting
        // dates before moving the rest to avoid constraint violations.
        const canonicalDates = (
          await tx.attendanceRecord.findMany({ where: { patientId: canonicalId }, select: { date: true } })
        ).map((r) => r.date);

        if (canonicalDates.length > 0) {
          await tx.attendanceRecord.deleteMany({ where: { patientId: dupId, tenantId: tid, date: { in: canonicalDates } } });
        }
        await tx.attendanceRecord.updateMany({ where: { patientId: dupId, tenantId: tid }, data: { patientId: canonicalId } });

        // Soft-delete the duplicate.
        await tx.patient.update({ where: { id: dupId }, data: { deletedAt: new Date() } });
      }

      if (accumulatedNotes !== (canonical.notes ?? "")) fieldUpdates.notes = accumulatedNotes || null;

      // Apply any field backfills to canonical.
      if (Object.keys(fieldUpdates).length > 0) {
        await tx.patient.update({ where: { id: canonicalId }, data: fieldUpdates });
      }

      await logAudit(tx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: "DELETE",
        entity: "Patient",
        entityId: canonicalId,
        diff: { mergedFrom: duplicateIds, duplicateCount: duplicates.length },
      });
    },
    { timeout: 30000, maxWait: 15000 }
  );

  return NextResponse.json({ merged: true, canonicalId, mergedCount: duplicates.length });
}
