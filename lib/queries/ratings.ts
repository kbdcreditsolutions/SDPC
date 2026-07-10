import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

const PATIENT_DIMS = ["punctuality", "attentionToDetail", "understanding", "communication", "overallExperience"];
const DEPT_DIMS = ["clinicalSkills", "documentation", "knowledge", "caseManagement"];

export async function getRatings(doctorIdParam?: string) {
  const { session } = await requireSession();
  if (!session) return { doctors: [], patientCount: 0, deptCount: 0, patientAvg: {}, deptAvg: {}, recent: [] };
  const scope = tenantScope(session);

  const doctorId = session.role === "DOCTOR" ? session.userId : doctorIdParam;

  const doctors = await prisma.user.findMany({
    where: { ...scope, role: "DOCTOR", ...(session.role === "DOCTOR" ? { id: session.userId } : {}) },
    orderBy: { name: "asc" },
  });

  if (!doctorId) {
    return { doctors: doctors.map((d) => ({ id: d.id, name: d.name, specialty: d.specialty })), patientCount: 0, deptCount: 0, patientAvg: {}, deptAvg: {}, recent: [] };
  }

  const ratings = await prisma.rating.findMany({
    where: { ...scope, doctorId },
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

  return {
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
  };
}
