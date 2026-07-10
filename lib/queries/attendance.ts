import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

function dayRange(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAttendance(dateStr?: string) {
  const { session } = await requireSession();
  if (!session) return { date: "", staff: [], patients: [] };
  const scope = tenantScope(session);

  const finalDateStr = dateStr ?? new Date().toISOString().slice(0, 10);
  const date = dayRange(finalDateStr);

  const [staff, patients, records] = await Promise.all([
    prisma.user.findMany({ where: { ...scope, isActive: true, deletedAt: null, ...(session.role === "DOCTOR" ? { id: session.userId } : {}) }, orderBy: { name: "asc" } }),
    prisma.patient.findMany({ where: { ...scope, deletedAt: null, ...(session.role === "DOCTOR" ? { appointments: { some: { doctorId: session.userId } } } : {}) }, orderBy: { name: "asc" } }),
    prisma.attendanceRecord.findMany({ where: { ...scope, date, ...(session.role === "DOCTOR" ? { OR: [{ userId: session.userId }, { patient: { appointments: { some: { doctorId: session.userId } } } }] } : {}) } }),
  ]);

  type AttRec = (typeof records)[number];
  const staffStatus = new Map<string, string>(
    records.filter((r: AttRec) => r.userId != null).map((r: AttRec) => [r.userId as string, r.status as string])
  );
  const patientStatus = new Map<string, string>(
    records.filter((r: AttRec) => r.patientId != null).map((r: AttRec) => [r.patientId as string, r.status as string])
  );

  return {
    date: finalDateStr,
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
  };
}
