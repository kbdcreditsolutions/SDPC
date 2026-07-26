import type { Prisma } from "@prisma/client";

/**
 * Same numbering scheme already used inline in /api/invoices and
 * /api/patients/[id]/packages — extracted here rather than copied a third
 * time for the single-visit invoice.
 */
export async function nextInvoiceNumber(tx: Prisma.TransactionClient, tenantId: string) {
  const year = new Date().getFullYear();
  const count = await tx.invoice.count({ where: { tenantId } });
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}
