import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

export type PatientRow = {
  id: string;
  name: string;
  phone: string;
  createdAt: Date;
  reason: string | null;
  leadSource: string | null;
  billed: number;
  outstanding: number;
};

export async function getPatients(q?: string): Promise<PatientRow[]> {
  const { session } = await requireSession();
  if (!session) return [];

  const scope = tenantScope(session);
  const query = q?.trim();

  const patients = await prisma.patient.findMany({
    where: {
      ...scope,
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { phone: { contains: query } },
            ],
          }
        : {}),
    },
    include: {
      invoices: { where: { deletedAt: null } },
    },
    orderBy: { createdAt: "desc" },
  });

  return patients.map((p) => {
    const billed = p.invoices.reduce((s, i) => s + Number(i.total), 0);
    const outstanding = p.invoices.reduce(
      (s, i) => s + (Number(i.total) - Number(i.paidAmount)),
      0
    );
    return {
      id: p.id,
      name: p.name,
      phone: p.phone,
      createdAt: p.createdAt,
      reason: p.reason,
      leadSource: p.leadSource,
      billed,
      outstanding,
    };
  });
}
