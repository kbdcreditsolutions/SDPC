import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { logAudit } from "@/lib/audit";
import { setTenantContext } from "@/lib/tenantPrisma";
import { logSession, sessionErrorMessage } from "@/lib/logSession";
import { istDateKey, istDayBounds } from "@/lib/istDate";
import { z } from "zod";
import { zodErrorMessage } from "@/lib/zodError";

// Two shapes, one action ("this patient was seen today"):
//  - from a booking: { appointmentId, packageId? } — the therapist comes from
//    the appointment, so the common case needs no extra input.
//  - walk-in / unbooked: { patientId, packageId, doctorId }.
//
// The appointment's own status is deliberately left alone: "was this patient
// seen today" is derived from whether a session exists for them today, which
// means Undo fully reverses a mistaken tap with no status left behind.
const schema = z.union([
  z.object({
    appointmentId: z.string().min(1),
    packageId: z.string().min(1).optional(),
    notes: z.string().optional(),
    force: z.boolean().optional(),
  }),
  z.object({
    patientId: z.string().min(1),
    packageId: z.string().min(1),
    doctorId: z.string().min(1),
    notes: z.string().optional(),
    force: z.boolean().optional(),
  }),
]);

export async function POST(req: NextRequest) {
  const { session, response, db } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  const data = parsed.data;

  // Resolve who this visit is for, verifying every id from the request against
  // this tenant before it reaches a write.
  let patientId: string;
  let doctorId: string;
  let packageId: string | undefined = data.packageId;

  if ("appointmentId" in data) {
    // Soft-deleting a patient doesn't cascade to their appointments, and the
    // duplicate rows staff created are exactly what an admin will delete — so a
    // deleted patient's booking must not still be loggable here.
    const appt = await db!.appointment.findFirst({
      where: {
        id: data.appointmentId,
        tenantId: session.tenantId!,
        deletedAt: null,
        patient: { deletedAt: null },
      },
    });
    if (!appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    if (appt.status === "CANCELLED") {
      return NextResponse.json({ error: "This appointment was cancelled" }, { status: 400 });
    }
    // The UI only renders today's bookings, so this only bites a direct API
    // call — but "mark today's visit" should not accept next week's appointment.
    const bounds = istDayBounds(istDateKey(new Date()));
    if (appt.datetime < bounds.start || appt.datetime > bounds.end) {
      return NextResponse.json({ error: "That appointment is not for today" }, { status: 400 });
    }
    patientId = appt.patientId;
    doctorId = appt.doctorId;
  } else {
    const patient = await db!.patient.findFirst({
      where: { id: data.patientId, tenantId: session.tenantId!, deletedAt: null },
    });
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    patientId = patient.id;
    doctorId = data.doctorId;
  }

  // No package given (one tap from a booking): only proceed when the choice is
  // unambiguous — exactly one active package with a session left.
  if (!packageId) {
    const candidates = await db!.package.findMany({
      where: { patientId, tenantId: session.tenantId!, deletedAt: null, status: "ACTIVE" },
      select: { id: true, totalSessions: true, usedSessions: true },
    });
    const usable = candidates.filter((p) => p.usedSessions < p.totalSessions);
    if (usable.length === 0) {
      return NextResponse.json({ error: "This patient has no active package with sessions left" }, { status: 400 });
    }
    if (usable.length > 1) {
      return NextResponse.json({ error: "Pick which package this session belongs to" }, { status: 400 });
    }
    packageId = usable[0].id;
  }

  const dateKey = istDateKey(new Date());
  const { start, end } = istDayBounds(dateKey);

  try {
    const result = await prisma.$transaction(async (tx) => {
      await setTenantContext(tx, session.tenantId!);

      // Guard the actual complaint from the clinic: the same visit getting
      // entered twice. Two concurrent requests would both pass a plain read
      // under READ COMMITTED, so serialise per patient-per-day first — the
      // lock is released when this transaction ends either way.
      if (!data.force) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${patientId}:${dateKey}`}, 0))`;
        const alreadyToday = await tx.packageSession.findFirst({
          where: { patientId, tenantId: session.tenantId!, deletedAt: null, date: { gte: start, lte: end } },
          select: { id: true },
        });
        if (alreadyToday) throw new Error("ALREADY_LOGGED_TODAY");
      }

      const created = await logSession(tx, {
        tenantId: session.tenantId!,
        patientId,
        packageId: packageId!,
        doctorId,
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      });

      await logAudit(tx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: "CREATE",
        entity: "PackageSession",
        entityId: created.id,
        diff: {
          via: "today",
          patientId,
          packageId,
          doctorId,
          ...("appointmentId" in data ? { appointmentId: data.appointmentId } : {}),
        },
      });

      return created;
    });

    return NextResponse.json({ session: result });
  } catch (err) {
    if (err instanceof Error && err.message === "ALREADY_LOGGED_TODAY") {
      return NextResponse.json(
        { error: "A session for this patient is already logged today.", alreadyLogged: true },
        { status: 409 }
      );
    }
    // Only the known guard failures are the caller's fault; anything else
    // (DB down, Prisma error) is ours and must not read as a bad request.
    const known = sessionErrorMessage(err);
    if (known) return NextResponse.json({ error: known }, { status: 400 });
    console.error("POST /api/visits failed", err);
    return NextResponse.json({ error: "Failed to log visit" }, { status: 500 });
  }
}
