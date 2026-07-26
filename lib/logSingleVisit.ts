import type { Prisma } from "@prisma/client";
import { nextInvoiceNumber } from "@/lib/invoiceNumber";

/**
 * Bills and logs a one-off visit for a patient with no active package —
 * e.g. someone who finished a package long ago and dropped in once. Reuses
 * the Package/Invoice billing pattern (a completed 1-session "package")
 * instead of a parallel entity, so it inherits the existing edit/refund/
 * delete UI for free.
 *
 * status is COMPLETED, not ACTIVE: the patient page's "you already have an
 * active package" warning is keyed on status === "ACTIVE", and a single
 * visit must not block (or need confirming past) a real package sale later.
 *
 * Must be called inside a transaction that has already run setTenantContext.
 * Throws the same error keys as logSession() where they overlap, so
 * sessionErrorMessage() in the caller covers both.
 */
export async function logSingleVisit(
  tx: Prisma.TransactionClient,
  {
    tenantId,
    patientId,
    doctorId,
    fee,
    paymentMode,
    date,
    notes,
  }: {
    tenantId: string;
    patientId: string;
    doctorId: string;
    fee: number;
    paymentMode: "Cash" | "UPI" | "Card" | "Netbanking";
    date?: Date;
    notes?: string;
  }
) {
  if (!tenantId) throw new Error("NO_TENANT");

  const doctor = await tx.user.findFirst({
    where: { id: doctorId, tenantId, role: "DOCTOR", isActive: true, deletedAt: null },
  });
  if (!doctor) throw new Error("DOCTOR_NOT_FOUND");

  const number = await nextInvoiceNumber(tx, tenantId);
  const invoice = await tx.invoice.create({
    data: {
      tenantId,
      patientId,
      number,
      subtotal: fee,
      gst: 0,
      total: fee,
      paidAmount: fee,
      status: "PAID",
      lineItems: {
        create: [{ description: "Single visit", qty: 1, unitPrice: fee, gstPercent: 0, lineTotal: fee }],
      },
      payments: { create: [{ method: paymentMode, amount: fee }] },
    },
  });

  const pkg = await tx.package.create({
    data: {
      tenantId,
      patientId,
      name: "Single Visit",
      totalSessions: 1,
      usedSessions: 1,
      price: fee,
      status: "COMPLETED",
      singleVisit: true,
      invoiceId: invoice.id,
    },
  });

  const session = await tx.packageSession.create({
    data: {
      tenantId,
      patientId,
      packageId: pkg.id,
      doctorId,
      ...(date ? { date } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  return { package: pkg, session, invoice };
}
