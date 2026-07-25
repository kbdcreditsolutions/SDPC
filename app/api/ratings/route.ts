import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { setTenantContext } from "@/lib/tenantPrisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { zodErrorMessage } from "@/lib/zodError";

const PATIENT_DIMS = ["punctuality", "attentionToDetail", "understanding", "communication", "overallExperience"];
const DEPT_DIMS = ["clinicalSkills", "documentation", "knowledge", "caseManagement"];

export async function GET(req: NextRequest) {
  const { session, response, db } = await requireSession();
  if (!session) return response!;
  const scope = tenantScope(session);

  const doctorId = session.role === "DOCTOR" ? session.userId : req.nextUrl.searchParams.get("doctorId");

  const doctors = await prisma.user.findMany({
    where: { ...scope, role: "DOCTOR", ...(session.role === "DOCTOR" ? { id: session.userId } : {}) },
    orderBy: { name: "asc" },
  });

  if (!doctorId) {
    return NextResponse.json({ doctors: doctors.map((d) => ({ id: d.id, name: d.name, specialty: d.specialty })) });
  }

  const ratings = await db!.rating.findMany({
    where: { ...scope, doctorId, deletedAt: null },
    orderBy: { date: "desc" },
  });

  const patientRatings = ratings.filter((r) => r.type === "PATIENT");
  const deptRatings = ratings.filter((r) => r.type === "DEPT_HEAD");

  function avgDims(rows: typeof ratings, dims: string[]) {
    const out: Record<string, number> = {};
    for (const dim of dims) {
      const vals = rows
        .map((r) => (r.scores as Record<string, number>)[dim])
        .filter((v) => typeof v === "number");
      out[dim] = vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100 : 0;
    }
    return out;
  }

  return NextResponse.json({
    doctors: doctors.map((d) => ({ id: d.id, name: d.name, specialty: d.specialty })),
    patientCount: patientRatings.length,
    deptCount: deptRatings.length,
    patientAvg: avgDims(patientRatings, PATIENT_DIMS),
    deptAvg: avgDims(deptRatings, DEPT_DIMS),
    recent: ratings.slice(0, 15).map((r) => ({
      id: r.id,
      type: r.type,
      date: r.date,
      scores: r.scores,
      comment: r.comment,
    })),
  });
}

const createSchema = z.object({
  doctorId: z.string().min(1),
  type: z.enum(["PATIENT", "DEPT_HEAD"]),
  scores: z.record(z.string(), z.number().int().min(1).max(5)),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { session, response, db } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;
  const scope = tenantScope(session);

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  }

  const expectedDims = parsed.data.type === "PATIENT" ? PATIENT_DIMS : DEPT_DIMS;
  const gotDims = Object.keys(parsed.data.scores);
  const dimsMatch = gotDims.length === expectedDims.length && expectedDims.every((d) => gotDims.includes(d));
  if (!dimsMatch) {
    return NextResponse.json(
      { error: `Scores must include exactly: ${expectedDims.join(", ")}` },
      { status: 400 }
    );
  }

  const doctor = await db!.user.findFirst({
    where: { id: parsed.data.doctorId, ...scope, role: "DOCTOR", deletedAt: null },
  });
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 400 });
  }

  const rating = await prisma.$transaction(async (tx) => {
    await setTenantContext(tx, session.tenantId!);
    const created = await tx.rating.create({
      data: {
        tenantId: session.tenantId!,
        doctorId: parsed.data.doctorId,
        type: parsed.data.type,
        scores: parsed.data.scores,
        comment: parsed.data.comment || null,
      },
    });
    await logAudit(tx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "CREATE",
      entity: "Rating",
      entityId: created.id,
      diff: { doctorId: created.doctorId, type: created.type },
    });
    return created;
  });

  return NextResponse.json({ rating });
}
