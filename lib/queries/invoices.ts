import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { istDayBounds } from "@/lib/istDate";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type InvoiceFilters = { from?: string; to?: string; status?: string };

export async function getInvoices(filters: InvoiceFilters = {}) {
  const { session, db } = await requireSession();
  if (!session) return [];
  const scope = tenantScope(session);

  const { from, to, status } = filters;
  const validFrom = from && DATE_RE.test(from) ? from : undefined;
  const validTo = to && DATE_RE.test(to) ? to : undefined;
  const validStatus = status && ["PAID", "UNPAID", "PARTIAL", "OUTSTANDING"].includes(status) ? status : undefined;

  const invoices = await db!.invoice.findMany({
    where: {
      ...scope,
      deletedAt: null,
      ...(validFrom || validTo ? {
        date: {
          ...(validFrom ? { gte: istDayBounds(validFrom).start } : {}),
          ...(validTo ? { lte: istDayBounds(validTo).end } : {}),
        },
      } : {}),
      ...(validStatus === "OUTSTANDING"
        ? { status: { in: ["UNPAID", "PARTIAL"] } }
        : validStatus
        ? { status: validStatus as "PAID" | "UNPAID" | "PARTIAL" }
        : {}),
    },
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
