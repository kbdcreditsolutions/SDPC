import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { setTenantContext } from "@/lib/tenantPrisma";
import { logSession, sessionErrorMessage } from "@/lib/logSession";
import { z } from "zod";
import { zodErrorMessage } from "@/lib/zodError";

export async function GET(req: NextRequest) {
  const { session, response, db } = await requireSession();
  if (!session) return response!;
  const scope = tenantScope(session);

  const patientId = req.nextUrl.searchParams.get("patientId")?.trim();

  const sessions = await db!.packageSession.findMany({
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

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  }
  const { date, ...rest } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      await setTenantContext(tx, session.tenantId!);
      return logSession(tx, {
        tenantId: session.tenantId!,
        patientId: rest.patientId,
        packageId: rest.packageId,
        doctorId: rest.doctorId,
        ...(date ? { date } : {}),
        ...(rest.notes !== undefined ? { notes: rest.notes } : {}),
      });
    });

    return NextResponse.json({ session: result });
  } catch (err) {
    const known = sessionErrorMessage(err);
    if (known) return NextResponse.json({ error: known }, { status: 400 });
    console.error("POST /api/sessions failed", err);
    return NextResponse.json({ error: "Failed to log session" }, { status: 500 });
  }
}
