import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

import { zodErrorMessage } from "@/lib/zodError";
const schema = z.object({
  action: z.enum(["freeze", "unfreeze", "extend", "refund", "edit"]),
  extendDays: z.coerce.number().int().positive().optional(),
  name: z.string().min(1).optional(),
  totalSessions: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().positive().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pkgId: string }> }
) {
  const { session, response } = await requireSession(["CLINIC_ADMIN", "STAFF"]);
  if (!session) return response!;
  const { pkgId } = await params;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });

  const pkg = await prisma.package.findFirst({ where: { id: pkgId, tenantId: session.tenantId! } });
  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.action === "edit") {
    if (pkg.status === "REFUNDED") {
      return NextResponse.json({ error: "Refunded packages can't be edited" }, { status: 400 });
    }
    const totalSessions = parsed.data.totalSessions ?? pkg.totalSessions;
    if (totalSessions < pkg.usedSessions) {
      return NextResponse.json(
        { error: `Total sessions can't be less than the ${pkg.usedSessions} already used` },
        { status: 400 }
      );
    }
    const name = parsed.data.name ?? pkg.name;
    const price = parsed.data.price ?? Number(pkg.price);

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.package.update({
          where: { id: pkgId },
          data: { name, totalSessions, price },
        });
        if (pkg.invoiceId && (name !== pkg.name || totalSessions !== pkg.totalSessions || price !== Number(pkg.price))) {
          await tx.invoice.update({
            where: { id: pkg.invoiceId },
            data: { subtotal: price, total: price, paidAmount: price },
          });
          await tx.invoiceLineItem.updateMany({
            where: { invoiceId: pkg.invoiceId },
            data: {
              description: `Package: ${name} (${totalSessions} sessions)`,
              unitPrice: price,
              lineTotal: price,
            },
          });
        }
        await logAudit(tx, {
          tenantId: session.tenantId,
          actorId: session.userId,
          action: "UPDATE",
          entity: "Package",
          entityId: result.id,
          diff: {
            action: "edit",
            before: { name: pkg.name, totalSessions: pkg.totalSessions, price: Number(pkg.price) },
            after: { name, totalSessions, price },
          },
        });
        return result;
      });
      return NextResponse.json({ package: { ...updated, price: Number(updated.price) } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        return NextResponse.json({ error: "Package not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
    }
  }

  let data: Record<string, unknown> = {};
  if (parsed.data.action === "freeze") data = { status: "FROZEN" };
  if (parsed.data.action === "unfreeze") data = { status: "ACTIVE" };
  if (parsed.data.action === "refund") data = { status: "REFUNDED" };
  if (parsed.data.action === "extend") {
    const base = pkg.endDate ?? new Date();
    const newEnd = new Date(base);
    newEnd.setDate(newEnd.getDate() + (parsed.data.extendDays ?? 30));
    data = { endDate: newEnd };
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.package.update({ where: { id: pkgId }, data });
      if (parsed.data.action === "refund" && pkg.invoiceId) {
        await tx.invoice.update({ where: { id: pkg.invoiceId }, data: { deletedAt: new Date() } });
      }
      await logAudit(tx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: "UPDATE",
        entity: "Package",
        entityId: result.id,
        diff: { action: parsed.data.action, before: { status: pkg.status, endDate: pkg.endDate }, after: data },
      });
      return result;
    });
    return NextResponse.json({ package: { ...updated, price: Number(updated.price) } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pkgId: string }> }
) {
  const { session, response } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;
  const { pkgId } = await params;

  const pkg = await prisma.package.findFirst({ where: { id: pkgId, tenantId: session.tenantId! } });
  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.package.update({ where: { id: pkgId }, data: { deletedAt: new Date() } });
      if (pkg.invoiceId) {
        await tx.invoice.update({ where: { id: pkg.invoiceId }, data: { deletedAt: new Date() } });
      }
      await logAudit(tx, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: "DELETE",
        entity: "Package",
        entityId: pkg.id,
        diff: { name: pkg.name, price: Number(pkg.price), invoiceId: pkg.invoiceId },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
