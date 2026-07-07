import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (!session) return response!;
  const { id } = await params;
  const scope = tenantScope(session);

  const invoice = await prisma.invoice.findFirst({
    where: { id, ...scope },
    include: { patient: true, lineItems: true, payments: true, tenant: true },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    invoice: {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      gst: Number(invoice.gst),
      total: Number(invoice.total),
      paidAmount: Number(invoice.paidAmount),
      lineItems: invoice.lineItems.map((li) => ({
        ...li,
        unitPrice: Number(li.unitPrice),
        gstPercent: Number(li.gstPercent),
        lineTotal: Number(li.lineTotal),
      })),
      payments: invoice.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
    },
  });
}
