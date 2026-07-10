import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

export async function getInvoices() {
  const { session } = await requireSession();
  if (!session) return [];
  const scope = tenantScope(session);

  const invoices = await prisma.invoice.findMany({
    where: { ...scope, deletedAt: null },
    include: { patient: true },
    orderBy: { date: "desc" },
  });

  return invoices.map((i) => ({
    id: i.id,
    number: i.number,
    date: i.date,
    patient: { id: i.patient.id, name: i.patient.name },
    subtotal: Number(i.subtotal),
    gst: Number(i.gst),
    total: Number(i.total),
    paidAmount: Number(i.paidAmount),
    balance: Number(i.total) - Number(i.paidAmount),
    status: i.status,
  }));
}
