import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { logAudit } from "@/lib/audit";
import { setTenantContext } from "@/lib/tenantPrisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { session, response, db } = await requireSession();
  if (!session) return response!;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const scope = tenantScope(session);

  const patients = await db!.patient.findMany({
    where: {
      ...scope,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
              { pid: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      invoices: { where: { deletedAt: null } },
      packages: { where: { deletedAt: null }, select: { id: true } },
      referredByPatient: { select: { id: true, name: true, phone: true, deletedAt: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = patients.map((p) => {
    const billed = p.invoices.reduce((s, i) => s + Number(i.total), 0);
    const outstanding = p.invoices.reduce(
      (s, i) => s + (Number(i.total) - Number(i.paidAmount)),
      0
    );
    return {
      id: p.id,
      pid: p.pid,
      name: p.name,
      phone: p.phone,
      age: p.age,
      gender: p.gender,
      address: p.address,
      referralDoctor: p.referralDoctor,
      referredByPatientId: p.referredByPatientId,
      referredByPatient:
        p.referredByPatient && !p.referredByPatient.deletedAt
          ? { id: p.referredByPatient.id, name: p.referredByPatient.name, phone: p.referredByPatient.phone }
          : null,
      createdAt: p.createdAt,
      reason: p.reason,
      leadSource: p.leadSource,
      branchId: p.branchId,
      branch: p.branch,
      billed,
      outstanding,
      hasPackage: p.packages.length > 0,
    };
  });

  return NextResponse.json({ patients: rows });
}

const createSchema = z
  .object({
    name: z.string().min(1).trim(),
    phone: z.string().min(1).trim(),
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
    referredByPatientId: z.string().optional(),
    branchId: z.union([z.literal(""), z.string()]).optional(),
    address: z.string().min(1),
    notes: z.string().optional(),
    confirmDuplicate: z.boolean().optional(),
    createdAt: z
      .union([
        z.literal(""),
        z.coerce.date().refine(
          (d) => {
            // 1-day grace so timezones ahead of UTC (e.g. IST) can submit "today" near midnight UTC
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

export async function POST(req: NextRequest) {
  const { session, response, db } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;
  const scope = tenantScope(session);

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { age, createdAt, referredByPatientId, branchId, confirmDuplicate, ...rest } = parsed.data;

  if (!confirmDuplicate) {
    const duplicate = await db!.patient.findFirst({
      where: {
        ...scope,
        deletedAt: null,
        phone: rest.phone,
        name: { equals: rest.name, mode: "insensitive" },
      },
      select: { id: true, pid: true, name: true, phone: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: "duplicate", duplicate }, { status: 409 });
    }
  }

  if (referredByPatientId) {
    const referrer = await db!.patient.findFirst({
      where: { id: referredByPatientId, ...scope, deletedAt: null },
    });
    if (!referrer) {
      return NextResponse.json({ error: "Referring patient not found" }, { status: 400 });
    }
  }

  if (branchId) {
    const branch = await db!.branch.findFirst({ where: { id: branchId, ...scope, deletedAt: null } });
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 400 });
    }
  }

  const patient = await prisma.$transaction(async (tx) => {
    await setTenantContext(tx, session.tenantId!);
    // Atomic counter: Prisma serializes concurrent UPDATEs to the same row,
    // so two simultaneous patient creations can never be assigned the same PID.
    const tenant = await tx.tenant.update({
      where: { id: session.tenantId! },
      data: { nextPatientNumber: { increment: 1 } },
    });
    const pid = `PID-${String(tenant.nextPatientNumber - 1).padStart(5, "0")}`;

    const created = await tx.patient.create({
      data: {
        ...rest,
        pid,
        age,
        branchId: branchId || null,
        ...(createdAt ? { createdAt } : {}),
        ...(referredByPatientId ? { referredByPatientId } : {}),
        tenantId: session.tenantId!,
      },
    });

    await logAudit(tx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "CREATE",
      entity: "Patient",
      entityId: created.id,
      diff: { name: created.name, phone: created.phone, pid: created.pid },
    });

    return created;
  });

  return NextResponse.json({ patient });
}
