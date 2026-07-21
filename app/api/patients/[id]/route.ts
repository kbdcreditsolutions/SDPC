import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const updateSchema = z
  .object({
    name: z.string().min(1),
    phone: z.string().min(1),
    age: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "") || v === null ? undefined : v,
      z.coerce.number().int().min(0).max(150)
    ),
    gender: z.string().min(1),
    reason: z.string().min(1),
    leadSource: z
      .enum(["DIRECT", "REFERRAL", "GOOGLE", "FACEBOOK", "WALK_IN", "WHATSAPP", "INSTAGRAM", "PATIENT_REFERRAL", "FLYERS", "HOARDINGS", "TV_ADS", "CINEMA_ADS", "NEWSPAPER_AD"])
      .optional(),
    referralDoctor: z.string().optional(),
    referredByPatientId: z.union([z.literal(""), z.string()]).optional(),
    branchId: z.union([z.literal(""), z.string()]).optional(),
    address: z.string().min(1),
    notes: z.string().optional(),
    createdAt: z
      .union([
        z.literal(""),
        z.coerce.date().refine(
          (d) => {
            const maxAllowed = new Date();
            maxAllowed.setUTCDate(maxAllowed.getUTCDate() + 1);
            return d <= maxAllowed;
          },
          { message: "Joined date cannot be in the future" }
        ),
      ])
      .optional(),
  })
  .refine((data) => data.leadSource !== "PATIENT_REFERRAL" || !!data.referredByPatientId, {
    message: "Select which existing patient referred them",
    path: ["referredByPatientId"],
  });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (!session) return response!;
  const { id } = await params;
  const scope = tenantScope(session);

  const patient = await prisma.patient.findFirst({
    where: { id, ...scope },
    include: {
      packages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          sessions: {
            where: { deletedAt: null },
            include: { doctor: { select: { id: true, name: true, specialty: true } } },
            orderBy: { date: "desc" },
          },
        },
      },
      invoices: { where: { deletedAt: null }, orderBy: { date: "desc" } },
      appointments: { where: { deletedAt: null }, include: { doctor: true }, orderBy: { datetime: "desc" } },
      clinicalNotes: { where: { deletedAt: null }, include: { author: true }, orderBy: { date: "desc" } },
      referredByPatient: { select: { id: true, name: true, phone: true, deletedAt: true } },
      referredPatients: { where: { deletedAt: null }, select: { id: true, name: true, phone: true, createdAt: true } },
    },
  });

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const billed = patient.invoices.reduce((s, i) => s + Number(i.total), 0);
  const paid = patient.invoices.reduce((s, i) => s + Number(i.paidAmount), 0);

  return NextResponse.json({
    patient: {
      ...patient,
      packages: patient.packages.map((p) => ({ ...p, price: Number(p.price) })),
      invoices: patient.invoices.map((i) => ({
        ...i,
        subtotal: Number(i.subtotal),
        gst: Number(i.gst),
        total: Number(i.total),
        paidAmount: Number(i.paidAmount),
      })),
      referredByPatient:
        patient.referredByPatient && !patient.referredByPatient.deletedAt
          ? {
              id: patient.referredByPatient.id,
              name: patient.referredByPatient.name,
              phone: patient.referredByPatient.phone,
            }
          : null,
      billed,
      paid,
      outstanding: billed - paid,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;
  const { id } = await params;
  const scope = tenantScope(session);

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { age, createdAt, referredByPatientId, branchId, ...rest } = parsed.data;

  if (referredByPatientId) {
    if (referredByPatientId === id) {
      return NextResponse.json({ error: "A patient cannot refer themselves" }, { status: 400 });
    }
    const referrer = await prisma.patient.findFirst({
      where: { id: referredByPatientId, ...scope, deletedAt: null },
    });
    if (!referrer) {
      return NextResponse.json({ error: "Referring patient not found" }, { status: 400 });
    }
  }

  if (branchId) {
    const branch = await prisma.branch.findFirst({ where: { id: branchId, ...scope, deletedAt: null } });
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 400 });
    }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const before = await tx.patient.findFirst({ where: { id, tenantId: session.tenantId! } });
      const result = await tx.patient.update({
        where: { id, tenantId: session.tenantId! },
        data: {
          ...rest,
          ...(referredByPatientId !== undefined
            ? { referredByPatientId: referredByPatientId || null }
            : {}),
          ...(branchId !== undefined ? { branchId: branchId || null } : {}),
          age,
          ...(createdAt ? { createdAt } : {}),
        },
      });
      const changedFields = before
        ? Object.keys(result).filter(
            (k) => JSON.stringify((before as Record<string, unknown>)[k]) !== JSON.stringify((result as Record<string, unknown>)[k])
          )
        : [];
      await logAudit(tx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: "UPDATE",
        entity: "Patient",
        entityId: result.id,
        diff: { name: result.name, pid: result.pid, changedFields },
      });
      return result;
    });
    return NextResponse.json({ patient: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update patient" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;
  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const deleted = await tx.patient.update({
        where: { id, tenantId: session.tenantId! },
        data: { deletedAt: new Date() },
      });
      await logAudit(tx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: "DELETE",
        entity: "Patient",
        entityId: deleted.id,
        diff: { name: deleted.name, phone: deleted.phone, pid: deleted.pid },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
