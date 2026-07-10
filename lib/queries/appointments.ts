import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

export async function getAppointments() {
  const { session } = await requireSession();
  if (!session) return [];
  const scope = tenantScope(session);

  const appointments = await prisma.appointment.findMany({
    where: { ...scope, deletedAt: null, ...(session.role === "DOCTOR" ? { doctorId: session.userId } : {}) },
    include: { patient: true, doctor: true },
    orderBy: { datetime: "asc" },
  });

  return appointments;
}
