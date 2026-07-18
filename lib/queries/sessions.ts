import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

export async function getPackageSessions() {
  const { session } = await requireSession();
  if (!session) return [];
  const scope = tenantScope(session);

  const sessions = await prisma.packageSession.findMany({
    where: { ...scope, deletedAt: null, ...(session.role === "DOCTOR" ? { doctorId: session.userId } : {}) },
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true, specialty: true } },
      package: { select: { id: true, name: true, totalSessions: true, usedSessions: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  return sessions;
}
