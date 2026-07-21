import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export async function GET() {
  const { session, response } = await requireSession();
  if (!session) return response!;
  const scope = tenantScope(session);

  const invoices = await prisma.invoice.findMany({
    where: { ...scope, deletedAt: null },
    include: { patient: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({
    invoices: invoices.map((i) => ({
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
    })),
  });
}

const lineItemSchema = z.object({
  description: z.string().min(1),
  qty: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
  gstPercent: z.coerce.number().nonnegative().default(18),
});

const schema = z.object({
  patientId: z.string().min(1),
  lineItems: z.array(lineItemSchema).min(1),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession(["CLINIC_ADMIN", "STAFF", "DOCTOR"]);
  if (!session) return response!;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const items = parsed.data.lineItems.map((li) => {
    const base = li.qty * li.unitPrice;
    const gst = base * (li.gstPercent / 100);
    return { ...li, lineTotal: base + gst, gstAmount: gst };
  });
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const gst = items.reduce((s, i) => s + i.gstAmount, 0);
  const total = subtotal + gst;

  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({ where: { tenantId: session.tenantId! } });
  const number = `INV-${year}-${String(count + 1).padStart(5, "0")}`;

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        tenantId: session.tenantId!,
        patientId: parsed.data.patientId,
        number,
        subtotal,
        gst,
        total,
        status: "UNPAID",
        lineItems: {
          create: items.map((i) => ({
            description: i.description,
            qty: i.qty,
            unitPrice: i.unitPrice,
            gstPercent: i.gstPercent,
            lineTotal: i.lineTotal,
          })),
        },
      },
    });
    await logAudit(tx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "CREATE",
      entity: "Invoice",
      entityId: created.id,
      diff: { number: created.number, total: Number(created.total), patientId: created.patientId },
    });
    return created;
  });

  return NextResponse.json({ invoice });
}
