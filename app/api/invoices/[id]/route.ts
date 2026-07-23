import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

import { zodErrorMessage } from "@/lib/zodError";
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession(["CLINIC_ADMIN", "SUPER_ADMIN"]);
  if (!session) return response!;
  const { id } = await params;
  const scope = tenantScope(session);

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });

  const existing = await prisma.invoice.findFirst({ where: { id, ...scope } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const patient = await prisma.patient.findFirst({
    where: { id: parsed.data.patientId, tenantId: session.tenantId!, deletedAt: null },
  });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = parsed.data.lineItems.map((li) => {
    const base = li.qty * li.unitPrice;
    const gst = base * (li.gstPercent / 100);
    return { ...li, lineTotal: base + gst, gstAmount: gst };
  });
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const gst = items.reduce((s, i) => s + i.gstAmount, 0);
  const total = subtotal + gst;

  const paidAmount = Number(existing.paidAmount);
  const status = paidAmount >= total ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";

  // Transaction to update invoice and replace line items
  await prisma.$transaction(async (tx) => {
    await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
    await tx.invoice.update({
      where: { id },
      data: {
        patientId: parsed.data.patientId,
        subtotal,
        gst,
        total,
        status,
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
      action: "UPDATE",
      entity: "Invoice",
      entityId: id,
      diff: {
        before: { total: Number(existing.total), subtotal: Number(existing.subtotal), patientId: existing.patientId },
        after: { total, subtotal, patientId: parsed.data.patientId },
      },
    });
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession(["CLINIC_ADMIN", "SUPER_ADMIN"]);
  if (!session) return response!;
  const { id } = await params;
  const scope = tenantScope(session);

  const existing = await prisma.invoice.findFirst({ where: { id, ...scope } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await logAudit(tx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "DELETE",
      entity: "Invoice",
      entityId: id,
      diff: { number: existing.number, total: Number(existing.total) },
    });
  });

  return NextResponse.json({ success: true });
}
