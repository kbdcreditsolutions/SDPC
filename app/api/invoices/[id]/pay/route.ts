import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

import { zodErrorMessage } from "@/lib/zodError";
const schema = z.object({
  method: z.enum(["Cash", "UPI", "Card", "Netbanking"]),
  amount: z.coerce.number().positive(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;
  const { id } = await params;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });

  if (!session.tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({ where: { id, tenantId: session.tenantId!, deletedAt: null } });
    if (!invoice) return { error: "Not found", status: 404 as const };

    const remaining = Number(invoice.total) - Number(invoice.paidAmount);
    if (parsed.data.amount > remaining) {
      return { error: `Payment exceeds balance of ₹${remaining}`, status: 400 as const };
    }

    const newPaid = Number(invoice.paidAmount) + parsed.data.amount;
    const status = newPaid >= Number(invoice.total) ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";

    // Optimistic lock: only apply if paidAmount/total haven't changed and the invoice
    // hasn't been deleted since we read it above — otherwise a concurrent payment, a
    // line-item edit, or a delete could race this write and corrupt or orphan it.
    const conditionalUpdate = await tx.invoice.updateMany({
      where: { id, paidAmount: invoice.paidAmount, total: invoice.total, deletedAt: null },
      data: { paidAmount: newPaid, status },
    });
    if (conditionalUpdate.count === 0) {
      return { error: "This invoice was just updated elsewhere — refresh and try again", status: 409 as const };
    }

    const payment = await tx.payment.create({
      data: { invoiceId: id, method: parsed.data.method, amount: parsed.data.amount },
    });

    await logAudit(tx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "CREATE",
      entity: "Payment",
      entityId: payment.id,
      diff: { invoiceId: id, method: parsed.data.method, amount: parsed.data.amount },
    });

    const updated = await tx.invoice.findUniqueOrThrow({ where: { id } });
    return { invoice: updated };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    invoice: { ...result.invoice, total: Number(result.invoice.total), paidAmount: Number(result.invoice.paidAmount) },
  });
}
