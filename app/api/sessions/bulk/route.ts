import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { setTenantContext } from "@/lib/tenantPrisma";
import { z } from "zod";
import { zodErrorMessage } from "@/lib/zodError";

const bulkSchema = z.object({
  patientId: z.string().min(1),
  packageId: z.string().min(1),
  count: z.coerce.number().int().min(1).max(60),
  doctorId: z.string().min(1).optional(),
  date: z.preprocess(
    (v) => (v === null ? undefined : v),
    z
      .union([
        z.literal(""),
        z.coerce.date().refine(
          (d) => {
            const maxAllowed = new Date();
            maxAllowed.setUTCDate(maxAllowed.getUTCDate() + 1);
            return d <= maxAllowed;
          },
          { message: "Session date cannot be in the future" }
        ),
      ])
      .optional()
  ),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;
  const scope = tenantScope(session);

  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  }
  const { date, count, doctorId, ...rest } = parsed.data;

  try {
    const created = await prisma.$transaction(async (tx) => {
      await setTenantContext(tx, session.tenantId!);
      const pkg = await tx.package.findFirst({
        where: { id: rest.packageId, patientId: rest.patientId, ...scope, deletedAt: null },
      });
      if (!pkg) throw new Error("PACKAGE_NOT_FOUND");
      if (pkg.status !== "ACTIVE") throw new Error("PACKAGE_NOT_ACTIVE");
      if (pkg.usedSessions + count > pkg.totalSessions) throw new Error("PACKAGE_EXHAUSTED");

      if (doctorId) {
        const doctor = await tx.user.findFirst({
          where: { id: doctorId, ...scope, role: "DOCTOR", isActive: true, deletedAt: null },
        });
        if (!doctor) throw new Error("DOCTOR_NOT_FOUND");
      }

      // Atomic claim against the live column (not the pre-transaction totalSessions read):
      // a concurrent edit to totalSessions between the findFirst above and this UPDATE can't
      // widen the window, since usedSessions + count <= totalSessions is evaluated by Postgres
      // against the current row, not a JS-computed constant.
      const claim = await tx.$executeRaw`
        UPDATE "Package"
        SET "usedSessions" = "usedSessions" + ${count}
        WHERE id = ${pkg.id}
          AND status = 'ACTIVE'::"PackageStatus"
          AND "usedSessions" + ${count} <= "totalSessions"
      `;
      if (claim === 0) throw new Error("PACKAGE_EXHAUSTED");

      // Stagger each row's date by 1s so same-batch sessions don't tie on the
      // ordinal sort — Postgres freezes now() to transaction start, so an
      // unstaggered createMany would give every row in this batch the exact
      // same `date` (and `createdAt`), making their display order ambiguous.
      const base = date ? date.getTime() : Date.now();
      await tx.packageSession.createMany({
        data: Array.from({ length: count }).map((_, i) => ({
          patientId: rest.patientId,
          packageId: rest.packageId,
          doctorId: doctorId ?? null,
          notes: rest.notes,
          tenantId: session.tenantId!,
          date: new Date(base + i * 1000),
        })),
      });

      return count;
    });

    return NextResponse.json({ created });
  } catch (err) {
    const message =
      err instanceof Error && err.message === "PACKAGE_EXHAUSTED"
        ? "Not enough remaining sessions in this package"
        : err instanceof Error && err.message === "PACKAGE_NOT_ACTIVE"
        ? "Package is not active"
        : err instanceof Error && err.message === "PACKAGE_NOT_FOUND"
        ? "Package not found"
        : err instanceof Error && err.message === "DOCTOR_NOT_FOUND"
        ? "Therapist not found"
        : "Failed to log sessions";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
