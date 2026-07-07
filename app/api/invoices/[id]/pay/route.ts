import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { z } from "zod";

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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  if (!session.tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const invoice = await prisma.invoice.findFirst({ where: { id, tenantId: session.tenantId, deletedAt: null } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const remaining = Number(invoice.total) - Number(invoice.paidAmount);
  if (parsed.data.amount > remaining) {
    return NextResponse.json({ error: `Payment exceeds balance of ₹${remaining}` }, { status: 400 });
  }

  await prisma.payment.create({
    data: { invoiceId: id, method: parsed.data.method, amount: parsed.data.amount },
  });

  const newPaid = Number(invoice.paidAmount) + parsed.data.amount;
  const status = newPaid >= Number(invoice.total) ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";

  const updated = await prisma.invoice.update({
    where: { id },
    data: { paidAmount: newPaid, status },
  });

  return NextResponse.json({ invoice: { ...updated, total: Number(updated.total), paidAmount: Number(updated.paidAmount) } });
}
