import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

export type PatientRow = {
  id: string;
  pid: string | null;
  name: string;
  phone: string;
  age: number | null;
  gender: string | null;
  address: string | null;
  referralDoctor: string | null;
  referredByPatientId: string | null;
  referredByPatient: { id: string; name: string; phone: string } | null;
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
      referredByPatient: { select: { id: true, name: true, phone: true, deletedAt: true } },
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
      pid: p.pid,
      name: p.name,
      phone: p.phone,
      age: p.age,
      gender: p.gender,
      address: p.address,
      referralDoctor: p.referralDoctor,
      referredByPatientId: p.referredByPatientId,
      referredByPatient:
        p.referredByPatient && !p.referredByPatient.deletedAt
          ? { id: p.referredByPatient.id, name: p.referredByPatient.name, phone: p.referredByPatient.phone }
          : null,
      createdAt: p.createdAt,
      reason: p.reason,
      leadSource: p.leadSource,
      billed,
      outstanding,
    };
  });
}
