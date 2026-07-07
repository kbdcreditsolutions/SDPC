import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { z } from "zod";

function dayRange(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireSession();
  if (!session) return response!;
  const scope = tenantScope(session);

  const dateStr = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const date = dayRange(dateStr);

  const [staff, patients, records] = await Promise.all([
    prisma.user.findMany({ where: { ...scope, isActive: true }, orderBy: { name: "asc" } }),
    prisma.patient.findMany({ where: scope, orderBy: { name: "asc" } }),
    prisma.attendanceRecord.findMany({ where: { ...scope, date } }),
  ]);

  type AttRec = (typeof records)[number];
  const staffStatus = new Map<string, string>(
    records.filter((r: AttRec) => r.userId != null).map((r: AttRec) => [r.userId as string, r.status as string])
  );
  const patientStatus = new Map<string, string>(
    records.filter((r: AttRec) => r.patientId != null).map((r: AttRec) => [r.patientId as string, r.status as string])
  );

  return NextResponse.json({
    date: dateStr,
    staff: staff.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      status: staffStatus.get(u.id) ?? "UNMARKED",
    })),
    patients: patients.map((p) => ({
      id: p.id,
      name: p.name,
      status: patientStatus.get(p.id) ?? "UNMARKED",
    })),
  });
}

const schema = z.object({
  date: z.string().min(1),
  subject: z.enum(["STAFF", "PATIENT"]),
  userId: z.string().optional(),
  patientId: z.string().optional(),
  status: z.enum(["PRESENT", "LEAVE", "ABSENT", "LATE"]),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const date = dayRange(parsed.data.date);
  const { subject, userId, patientId, status } = parsed.data;

  const where =
    subject === "STAFF"
      ? { tenantId_date_userId: { tenantId: session.tenantId!, date, userId: userId! } }
      : { tenantId_date_patientId: { tenantId: session.tenantId!, date, patientId: patientId! } };

  const record = await prisma.attendanceRecord.upsert({
    where: where as any,
    create: {
      tenantId: session.tenantId!,
      date,
      subject,
      userId: subject === "STAFF" ? userId : undefined,
      patientId: subject === "PATIENT" ? patientId : undefined,
      status,
    },
    update: { status },
  });

  return NextResponse.json({ record });
}
