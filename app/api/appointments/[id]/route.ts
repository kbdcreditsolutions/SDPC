import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { logAudit } from "@/lib/audit";
import { setTenantContext } from "@/lib/tenantPrisma";
import { z } from "zod";
import { zodErrorMessage } from "@/lib/zodError";

const schema = z.object({
  action: z.enum(["cancel"]).optional(),
  patientId: z.string().min(1).optional(),
  doctorId: z.string().min(1).optional(),
  datetime: z.string().min(1).optional(),
  durationMin: z.coerce.number().int().positive().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response, db } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;
  const { id } = await params;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });

  const appt = await db!.appointment.findFirst({ where: { id, tenantId: session.tenantId!, deletedAt: null } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.action === "cancel") {
    if (appt.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Only scheduled appointments can be cancelled" }, { status: 400 });
    }
    try {
      const updated = await prisma.$transaction(async (tx) => {
        await setTenantContext(tx, session.tenantId!);
        const result = await tx.appointment.update({
          where: { id },
          data: { status: "CANCELLED" },
          include: { patient: true, doctor: true },
        });
        await logAudit(tx, {
          tenantId: session.tenantId,
          actorId: session.userId,
          action: "UPDATE",
          entity: "Appointment",
          entityId: result.id,
          diff: { action: "cancel", before: { status: appt.status }, after: { status: "CANCELLED" } },
        });
        return result;
      });
      return NextResponse.json({ appointment: updated });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to cancel appointment" }, { status: 500 });
    }
  }

  if (appt.status !== "SCHEDULED") {
    return NextResponse.json({ error: "Only scheduled appointments can be edited" }, { status: 400 });
  }

  if (parsed.data.patientId) {
    const patient = await db!.patient.findFirst({
      where: { id: parsed.data.patientId, tenantId: session.tenantId!, deletedAt: null },
    });
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }
  if (parsed.data.doctorId) {
    const doctor = await db!.user.findFirst({
      where: { id: parsed.data.doctorId, tenantId: session.tenantId!, deletedAt: null },
    });
    if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.patientId) data.patientId = parsed.data.patientId;
  if (parsed.data.doctorId) data.doctorId = parsed.data.doctorId;
  if (parsed.data.datetime) data.datetime = new Date(parsed.data.datetime);
  if (parsed.data.durationMin) data.durationMin = parsed.data.durationMin;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await setTenantContext(tx, session.tenantId!);
      const result = await tx.appointment.update({
        where: { id },
        data,
        include: { patient: true, doctor: true },
      });
      await logAudit(tx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: "UPDATE",
        entity: "Appointment",
        entityId: result.id,
        diff: {
          action: "edit",
          before: {
            patientId: appt.patientId,
            doctorId: appt.doctorId,
            datetime: appt.datetime,
            durationMin: appt.durationMin,
            notes: appt.notes,
          },
          after: data,
        },
      });
      return result;
    });
    return NextResponse.json({ appointment: updated });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response, db } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;
  const { id } = await params;

  const appt = await db!.appointment.findFirst({ where: { id, tenantId: session.tenantId!, deletedAt: null } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      await setTenantContext(tx, session.tenantId!);
      await tx.appointment.update({ where: { id }, data: { deletedAt: new Date() } });
      await logAudit(tx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: "DELETE",
        entity: "Appointment",
        entityId: appt.id,
        diff: { patientId: appt.patientId, doctorId: appt.doctorId, datetime: appt.datetime },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
