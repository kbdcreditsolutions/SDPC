import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  totalSessions: z.coerce.number().int().positive(),
  price: z.coerce.number().positive(),
  paymentMode: z.enum(["Cash", "UPI", "Card", "Netbanking"]),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (!session) return response!;
  const { id } = await params;
  const scope = tenantScope(session);

  const packages = await prisma.package.findMany({
    where: { patientId: id, ...scope, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    packages: packages.map((p) => ({ ...p, price: Number(p.price) })),
  });
}

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

  const patient = await prisma.patient.findFirst({
    where: { id, tenantId: session.tenantId!, deletedAt: null },
  });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pkg = await prisma.$transaction(async (tx) => {
    const year = new Date().getFullYear();
    const count = await tx.invoice.count({ where: { tenantId: session.tenantId! } });
    const number = `INV-${year}-${String(count + 1).padStart(5, "0")}`;

    const invoice = await tx.invoice.create({
      data: {
        tenantId: session.tenantId!,
        patientId: id,
        number,
        subtotal: parsed.data.price,
        gst: 0,
        total: parsed.data.price,
        paidAmount: parsed.data.price,
        status: "PAID",
        lineItems: {
          create: [{
            description: `Package: ${parsed.data.name} (${parsed.data.totalSessions} sessions)`,
            qty: 1,
            unitPrice: parsed.data.price,
            gstPercent: 0,
            lineTotal: parsed.data.price,
          }],
        },
        payments: {
          create: [{ method: parsed.data.paymentMode, amount: parsed.data.price }],
        },
      },
    });

    return tx.package.create({
      data: {
        tenantId: session.tenantId!,
        patientId: id,
        name: parsed.data.name,
        totalSessions: parsed.data.totalSessions,
        price: parsed.data.price,
        invoiceId: invoice.id,
      },
    });
  });

  return NextResponse.json({ package: { ...pkg, price: Number(pkg.price) } });
}
