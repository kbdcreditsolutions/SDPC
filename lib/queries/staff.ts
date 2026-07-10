import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

export async function getStaff() {
  const { session } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return [];
  const scope = tenantScope(session);

  const users = await prisma.user.findMany({
    where: { ...scope, deletedAt: null },
    orderBy: { name: "asc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    specialty: u.specialty,
    isActive: u.isActive,
  }));
}
