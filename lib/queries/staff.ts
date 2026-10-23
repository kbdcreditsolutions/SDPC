import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

export type StaffUser = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  specialty: string | null;
  title: string | null;
  branchId: string | null;
  branchName: string | null;
  isActive: boolean;
  hasPassword: boolean;
  createdAt?: string;
};

export type BranchOption = {
  id: string;
  name: string;
  city: string | null;
};

export async function getStaff(): Promise<StaffUser[]> {
  const { session } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return [];
  const scope = tenantScope(session);

  const users = await prisma.user.findMany({
    where: { ...scope, deletedAt: null },
    include: { branch: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    specialty: u.specialty,
    title: u.title,
    branchId: u.branchId,
    branchName: u.branch?.name ?? null,
    isActive: u.isActive,
    hasPassword: !!u.passwordHash,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function getBranches(): Promise<BranchOption[]> {
  const { session } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return [];

  return prisma.branch.findMany({
    where: { tenantId: session.tenantId!, deletedAt: null },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });
}
