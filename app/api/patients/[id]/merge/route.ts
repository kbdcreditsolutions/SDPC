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
    // Count what would be moved without writing anything.
    const counts = await Promise.all(
      duplicateIds.map(async (dupId) => ({
        dupId,
        packages: await prisma.package.count({ where: { patientId: dupId, deletedAt: null } }),
        invoices: await prisma.invoice.count({ where: { patientId: dupId, deletedAt: null } }),
        sessions: await prisma.packageSession.count({ where: { patientId: dupId, deletedAt: null } }),
        appointments: await prisma.appointment.count({ where: { patientId: dupId, deletedAt: null } }),
        clinicalNotes: await prisma.clinicalNote.count({ where: { patientId: dupId, deletedAt: null } }),
        attendance: await prisma.attendanceRecord.count({ where: { patientId: dupId } }),
      }))
    );
    return NextResponse.json({ dryRun: true, canonicalId, counts });
  }

  await prisma.$transaction(
    async (tx) => {
      await setTenantContext(tx, session.tenantId!);

      // Accumulate fields to copy to canonical from duplicates if canonical is missing them.
      const fieldUpdates: Record<string, unknown> = {};

      for (const dup of duplicates) {
        const dupId = dup.id;

        // Copy any non-empty fields canonical is missing.
        if (!canonical.reason && dup.reason) fieldUpdates.reason = dup.reason;
        if (!canonical.notes && dup.notes) fieldUpdates.notes = dup.notes;
        if (!canonical.address && dup.address) fieldUpdates.address = dup.address;
        if (!canonical.age && dup.age) fieldUpdates.age = dup.age;
        if (!canonical.gender && dup.gender) fieldUpdates.gender = dup.gender;
        if (!canonical.leadSource && dup.leadSource) fieldUpdates.leadSource = dup.leadSource;
        if (!canonical.referralDoctor && dup.referralDoctor) fieldUpdates.referralDoctor = dup.referralDoctor;

        // Reassign all child records.
        await tx.package.updateMany({ where: { patientId: dupId }, data: { patientId: canonicalId } });
        await tx.packageSession.updateMany({ where: { patientId: dupId }, data: { patientId: canonicalId } });
        await tx.invoice.updateMany({ where: { patientId: dupId }, data: { patientId: canonicalId } });
        await tx.appointment.updateMany({ where: { patientId: dupId }, data: { patientId: canonicalId } });
        await tx.clinicalNote.updateMany({ where: { patientId: dupId }, data: { patientId: canonicalId } });

        // Any patient referred by this duplicate should now point to canonical.
        await tx.patient.updateMany({
          where: { referredByPatientId: dupId },
          data: { referredByPatientId: canonicalId },
        });

        // AttendanceRecord has @@unique([tenantId, date, patientId]) — must delete
        // any duplicate-date records before moving the rest to avoid constraint violations.
        const canonicalDates = (
          await tx.attendanceRecord.findMany({ where: { patientId: canonicalId }, select: { date: true } })
        ).map((r) => r.date);

        if (canonicalDates.length > 0) {
          await tx.attendanceRecord.deleteMany({ where: { patientId: dupId, date: { in: canonicalDates } } });
        }
        await tx.attendanceRecord.updateMany({ where: { patientId: dupId }, data: { patientId: canonicalId } });

        // Soft-delete the duplicate.
        await tx.patient.update({ where: { id: dupId }, data: { deletedAt: new Date() } });
      }

      // Apply any field backfills to canonical.
      if (Object.keys(fieldUpdates).length > 0) {
        await tx.patient.update({ where: { id: canonicalId }, data: fieldUpdates });
      }

      await logAudit(tx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: "MERGE",
        entity: "Patient",
        entityId: canonicalId,
        diff: { mergedFrom: duplicateIds, duplicateCount: duplicates.length },
      });
    },
    { timeout: 30000, maxWait: 15000 }
  );

  return NextResponse.json({ merged: true, canonicalId, mergedCount: duplicates.length });
}
