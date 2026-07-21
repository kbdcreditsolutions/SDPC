import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { z } from "zod";

const schema = z.object({
  method: z.enum(["Cash", "UPI", "Card", "Netbanking"]),
  amount: z.coerce.number().positive(),
});

class InvoiceNotFoundError extends Error {}
class BalanceExceededError extends Error {}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;
  const { id } = await params;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  if (!session.tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const updated = await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT id FROM "Invoice" WHERE id = ${id} AND "tenantId" = ${session.tenantId} AND "deletedAt" IS NULL FOR UPDATE`;

        const invoice = await tx.invoice.findFirst({ where: { id, tenantId: session.tenantId!, deletedAt: null } });
        if (!invoice) throw new InvoiceNotFoundError();

        const remaining = Number(invoice.total) - Number(invoice.paidAmount);
        if (parsed.data.amount > remaining) {
          throw new BalanceExceededError(`Payment exceeds balance of ₹${remaining}`);
        }

        await tx.payment.create({
          data: { invoiceId: id, method: parsed.data.method, amount: parsed.data.amount },
        });

        const newPaid = Number(invoice.paidAmount) + parsed.data.amount;
        const status = newPaid >= Number(invoice.total) ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";

        return tx.invoice.update({
          where: { id },
          data: { paidAmount: { increment: parsed.data.amount }, status },
        });
      },
      { maxWait: 5000, timeout: 10000 }
    );

    return NextResponse.json({ invoice: { ...updated, total: Number(updated.total), paidAmount: Number(updated.paidAmount) } });
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (err instanceof BalanceExceededError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
