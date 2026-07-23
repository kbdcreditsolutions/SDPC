import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { z } from "zod";

import { zodErrorMessage } from "@/lib/zodError";
export async function GET(req: NextRequest) {
  const { session, response } = await requireSession();
  if (!session) return response!;
  const scope = tenantScope(session);

  const patientId = req.nextUrl.searchParams.get("patientId")?.trim();

  const sessions = await prisma.packageSession.findMany({
    where: {
      ...scope,
      deletedAt: null,
      ...(patientId ? { patientId } : {}),
      ...(session.role === "DOCTOR" ? { doctorId: session.userId } : {}),
    },
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true, specialty: true } },
      package: { select: { id: true, name: true, totalSessions: true, usedSessions: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  return NextResponse.json({ sessions });
}

const createSchema = z.object({
  patientId: z.string().min(1),
  packageId: z.string().min(1),
  doctorId: z.string().min(1),
  date: z
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
    .optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;
  const scope = tenantScope(session);

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  }
  const { date, ...rest } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const pkg = await tx.package.findFirst({
        where: { id: rest.packageId, patientId: rest.patientId, ...scope, deletedAt: null },
      });
      if (!pkg) throw new Error("PACKAGE_NOT_FOUND");
      if (pkg.status !== "ACTIVE") throw new Error("PACKAGE_NOT_ACTIVE");
      if (pkg.usedSessions >= pkg.totalSessions) throw new Error("PACKAGE_EXHAUSTED");

      const doctor = await tx.user.findFirst({
        where: { id: rest.doctorId, ...scope, role: "DOCTOR", isActive: true, deletedAt: null },
      });
      if (!doctor) throw new Error("DOCTOR_NOT_FOUND");

      // Atomic claim: literal `lt: pkg.totalSessions` (immutable, never edited elsewhere)
      // means only one of N concurrent requests can win this UPDATE once the package
      // is at capacity — prevents usedSessions from overshooting totalSessions.
      const claim = await tx.package.updateMany({
        where: { id: pkg.id, status: "ACTIVE", usedSessions: { lt: pkg.totalSessions } },
        data: { usedSessions: { increment: 1 } },
      });
      if (claim.count === 0) throw new Error("PACKAGE_EXHAUSTED");

      const created = await tx.packageSession.create({
        data: {
          ...rest,
          ...(date ? { date } : {}),
          tenantId: session.tenantId!,
        },
      });

      return created;
    });

    return NextResponse.json({ session: result });
  } catch (err) {
    const message =
      err instanceof Error && err.message === "PACKAGE_EXHAUSTED"
        ? "Package has no remaining sessions"
        : err instanceof Error && err.message === "PACKAGE_NOT_ACTIVE"
        ? "Package is not active"
        : err instanceof Error && err.message === "PACKAGE_NOT_FOUND"
        ? "Package not found"
        : err instanceof Error && err.message === "DOCTOR_NOT_FOUND"
        ? "Therapist not found"
        : "Failed to log session";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
