import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { logAudit } from "@/lib/audit";
import { setTenantContext } from "@/lib/tenantPrisma";
import { z } from "zod";
import { zodErrorMessage } from "@/lib/zodError";

// Merge into an existing package — no new invoice created
const existingPkgSchema = z.object({
  targetPackageId: z.string().uuid(),
  singleVisitPackageIds: z.array(z.string().uuid()).min(1),
});

// Create a new package from the merged visits
const newPkgSchema = z.discriminatedUnion("markPaid", [
  z.object({
    markPaid: z.literal(true),
    singleVisitPackageIds: z.array(z.string().uuid()).min(1),
    name: z.string().min(1),
    price: z.coerce.number().nonnegative(),
    paymentMode: z.enum(["Cash", "UPI", "Card", "Netbanking"]),
  }),
  z.object({
    markPaid: z.literal(false),
    singleVisitPackageIds: z.array(z.string().uuid()).min(1),
    name: z.string().min(1),
    price: z.coerce.number().nonnegative(),
    paymentMode: z.enum(["Cash", "UPI", "Card", "Netbanking"]).optional(),
  }),
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response, db } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;
  const { id: patientId } = await params;

  const body = await req.json();
  const scope = tenantScope(session);

  const patient = await db!.patient.findFirst({
    where: { id: patientId, ...scope, deletedAt: null },
  });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  // Route: merge into existing package
  if (body.targetPackageId) {
    const parsed = existingPkgSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });

    const targetPkg = await db!.package.findFirst({
      where: { id: parsed.data.targetPackageId, patientId, tenantId: session.tenantId!, singleVisit: false, deletedAt: null },
    });
    if (!targetPkg) return NextResponse.json({ error: "Target package not found" }, { status: 404 });

    // Pre-check source packages exist (full verification happens inside tx)
    const sourceCount = await db!.package.count({
      where: { id: { in: parsed.data.singleVisitPackageIds }, patientId, tenantId: session.tenantId!, singleVisit: true, deletedAt: null },
    });
    if (sourceCount !== parsed.data.singleVisitPackageIds.length) {
      return NextResponse.json({ error: "One or more packages not found or not eligible for merge" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      await setTenantContext(tx, session.tenantId!);
      const now = new Date();

      // Re-fetch inside tx so session counts are consistent with the rows we move
      const packages = await tx.package.findMany({
        where: { id: { in: parsed.data.singleVisitPackageIds }, patientId, tenantId: session.tenantId!, singleVisit: true, deletedAt: null },
        include: { sessions: { where: { deletedAt: null } } },
      });
      const totalSessions = packages.reduce((s, p) => s + p.sessions.length, 0);

      // Re-fetch target inside tx and auto-extend totalSessions if needed
      const currentTarget = await tx.package.findFirst({
        where: { id: parsed.data.targetPackageId, tenantId: session.tenantId!, deletedAt: null },
      });
      if (!currentTarget) return null;

      const newUsed = currentTarget.usedSessions + totalSessions;
      const newTotal = Math.max(currentTarget.totalSessions, newUsed);

      // Reassign sessions to target package
      for (const oldPkg of packages) {
        if (oldPkg.sessions.length > 0) {
          await tx.packageSession.updateMany({
            where: { packageId: oldPkg.id, deletedAt: null },
            data: { packageId: parsed.data.targetPackageId },
          });
        }
      }

      // Update usedSessions (and totalSessions if auto-extended)
      const updated = await tx.package.updateMany({
        where: { id: parsed.data.targetPackageId, tenantId: session.tenantId!, deletedAt: null },
        data: { usedSessions: newUsed, totalSessions: newTotal },
      });
      if (updated.count !== 1) return null;

      // Soft-delete old single-visit packages and void their invoices
      for (const oldPkg of packages) {
        await tx.package.updateMany({
          where: { id: oldPkg.id, tenantId: session.tenantId! },
          data: { deletedAt: now },
        });
        if (oldPkg.invoiceId) {
          await tx.invoice.update({
            where: { id: oldPkg.invoiceId, tenantId: session.tenantId! },
            data: { deletedAt: now },
          });
        }
      }

      await logAudit(tx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: "UPDATE",
        entity: "Package",
        entityId: parsed.data.targetPackageId,
        diff: { mergedFrom: packages.map((p) => p.id), sessionsAdded: totalSessions },
      });

      return await tx.package.findUnique({ where: { id: parsed.data.targetPackageId } });
    });

    if (!result) return NextResponse.json({ error: "Target package no longer available" }, { status: 409 });
    return NextResponse.json({ package: { ...result, price: Number(result.price) } });
  }

  // Route: create new package
  const parsed = newPkgSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });

  const packages = await db!.package.findMany({
    where: { id: { in: parsed.data.singleVisitPackageIds }, patientId, tenantId: session.tenantId!, singleVisit: true, deletedAt: null },
    include: { sessions: { where: { deletedAt: null } } },
  });
  if (packages.length !== parsed.data.singleVisitPackageIds.length) {
    return NextResponse.json({ error: "One or more packages not found or not eligible for merge" }, { status: 400 });
  }

  const totalSessions = packages.reduce((s, p) => s + p.sessions.length, 0);
  const isPaid = parsed.data.markPaid === true;

  const pkg = await prisma.$transaction(async (tx) => {
    await setTenantContext(tx, session.tenantId!);

    const year = new Date().getFullYear();
    const count = await tx.invoice.count({ where: { tenantId: session.tenantId! } });
    const number = `INV-${year}-${String(count + 1).padStart(5, "0")}`;

    const invoice = await tx.invoice.create({
      data: {
        tenantId: session.tenantId!,
        patientId,
        number,
        subtotal: parsed.data.price,
        gst: 0,
        total: parsed.data.price,
        paidAmount: isPaid ? parsed.data.price : 0,
        status: isPaid ? "PAID" : "UNPAID",
        lineItems: {
          create: [{
            description: `Package: ${parsed.data.name} (${totalSessions} sessions)`,
            qty: 1,
            unitPrice: parsed.data.price,
            gstPercent: 0,
            lineTotal: parsed.data.price,
          }],
        },
        ...(isPaid && parsed.data.paymentMode ? {
          payments: { create: [{ method: parsed.data.paymentMode, amount: parsed.data.price }] },
        } : {}),
      },
    });

    const newPkg = await tx.package.create({
      data: {
        tenantId: session.tenantId!,
        patientId,
        name: parsed.data.name,
        totalSessions: Math.max(totalSessions, 1),
        usedSessions: totalSessions,
        price: parsed.data.price,
        invoiceId: invoice.id,
        singleVisit: false,
      },
    });

    for (const oldPkg of packages) {
      if (oldPkg.sessions.length > 0) {
        await tx.packageSession.updateMany({
          where: { packageId: oldPkg.id, deletedAt: null },
          data: { packageId: newPkg.id },
        });
      }
    }

    const now = new Date();
    for (const oldPkg of packages) {
      await tx.package.updateMany({
        where: { id: oldPkg.id, tenantId: session.tenantId! },
        data: { deletedAt: now },
      });
      if (oldPkg.invoiceId) {
        await tx.invoice.update({
          where: { id: oldPkg.invoiceId, tenantId: session.tenantId! },
          data: { deletedAt: now },
        });
      }
    }

    await logAudit(tx, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "CREATE",
      entity: "Package",
      entityId: newPkg.id,
      diff: { name: newPkg.name, price: Number(newPkg.price), totalSessions: newPkg.totalSessions, mergedFrom: packages.map((p) => p.id), invoiceId: invoice.id },
    });

    return newPkg;
  });

  return NextResponse.json({ package: { ...pkg, price: Number(pkg.price) } });
}
