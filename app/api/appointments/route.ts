import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { logAudit } from "@/lib/audit";
import { setTenantContext } from "@/lib/tenantPrisma";
import { z } from "zod";
import { zodErrorMessage } from "@/lib/zodError";

export async function GET() {
  const { session, response, db } = await requireSession();
  if (!session) return response!;
  const scope = tenantScope(session);

  const appointments = await db!.appointment.findMany({
    where: { ...scope, deletedAt: null, ...(session.role === "DOCTOR" ? { doctorId: session.userId } : {}) },
    include: { patient: true, doctor: true },
    orderBy: { datetime: "asc" },
  });

  return NextResponse.json({ appointments });
}

const schema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  datetime: z.string().min(1),
  durationMin: z.coerce.number().int().positive().default(45),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { session, response, db } = await requireSession(["CLINIC_ADMIN", "STAFF", "DOCTOR"]);
  if (!session) return response!;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });

  const [patient, doctor] = await Promise.all([
    db!.patient.findFirst({ where: { id: parsed.data.patientId, tenantId: session.tenantId!, deletedAt: null } }),
    db!.user.findFirst({ where: { id: parsed.data.doctorId, tenantId: session.tenantId!, deletedAt: null } }),
  ]);
  if (!patient || !doctor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const appt = await prisma.$transaction(async (tx) => {
    await setTenantContext(tx, session.tenantId!);
    const result = await tx.appointment.create({
      data: {
        tenantId: session.tenantId!,
        patientId: parsed.data.patientId,
        doctorId: parsed.data.doctorId,
        datetime: new Date(parsed.data.datetime),
        durationMin: parsed.data.durationMin,
        notes: parsed.data.notes,
      },
      include: { patient: true, doctor: true },
    });
    await logAudit(tx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "CREATE",
      entity: "Appointment",
      entityId: result.id,
      diff: { patientId: result.patientId, doctorId: result.doctorId, datetime: result.datetime },
    });
    return result;
  });

  return NextResponse.json({ appointment: appt });
}
