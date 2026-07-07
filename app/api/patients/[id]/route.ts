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

  const patient = await prisma.patient.findFirst({
    where: { id, ...scope },
    include: {
      packages: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { date: "desc" } },
      appointments: { include: { doctor: true }, orderBy: { datetime: "desc" } },
      clinicalNotes: { include: { author: true }, orderBy: { date: "desc" } },
    },
  });

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const billed = patient.invoices.reduce((s, i) => s + Number(i.total), 0);
  const paid = patient.invoices.reduce((s, i) => s + Number(i.paidAmount), 0);

  return NextResponse.json({
    patient: {
      ...patient,
      packages: patient.packages.map((p) => ({ ...p, price: Number(p.price) })),
      invoices: patient.invoices.map((i) => ({
        ...i,
        subtotal: Number(i.subtotal),
        gst: Number(i.gst),
        total: Number(i.total),
        paidAmount: Number(i.paidAmount),
      })),
      billed,
      paid,
      outstanding: billed - paid,
    },
  });
}
