import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { session, response } = await requireSession();
  if (!session) return response!;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const scope = tenantScope(session);

  const patients = await prisma.patient.findMany({
    where: {
      ...scope,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      invoices: { where: { deletedAt: null } },
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
      name: p.name,
      phone: p.phone,
      age: p.age,
      gender: p.gender,
      address: p.address,
      referralDoctor: p.referralDoctor,
      createdAt: p.createdAt,
      reason: p.reason,
      leadSource: p.leadSource,
      billed,
      outstanding,
    };
  });

  return NextResponse.json({ patients: rows });
}

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  age: z.coerce.number().int().min(0).max(150),
  gender: z.string().optional(),
  reason: z.string().optional(),
  leadSource: z
    .enum(["DIRECT", "REFERRAL", "GOOGLE", "FACEBOOK", "WALK_IN", "WHATSAPP", "INSTAGRAM"])
    .optional(),
  referralDoctor: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
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
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { createdAt, ...rest } = parsed.data;
  const patient = await prisma.patient.create({
    data: {
      ...rest,
      ...(createdAt ? { createdAt } : {}),
      tenantId: session.tenantId!,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "CREATE",
      entity: "Patient",
      entityId: patient.id,
    },
  });

  return NextResponse.json({ patient });
}
