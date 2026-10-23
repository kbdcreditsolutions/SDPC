import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { zodErrorMessage } from "@/lib/zodError";

const updateSchema = z
  .object({
    isActive: z.boolean().optional(),
    name: z.string().trim().min(1, "Name cannot be empty").optional(),
    role: z.enum(["CLINIC_ADMIN", "DOCTOR", "STAFF"]).optional(),
    specialty: z.string().trim().nullable().optional(),
    title: z.string().trim().nullable().optional(),
    branchId: z.string().nullable().optional(),
    hasAccess: z.boolean().optional(),
    email: z.union([z.literal(""), z.string().email()]).nullable().optional(),
    password: z.union([z.literal(""), z.string().min(6, "Password must be at least 6 characters")]).optional(),
  });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;
  const { id } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });

  const existingUser = await prisma.user.findFirst({
    where: { id, tenantId: session.tenantId!, deletedAt: null },
  });
  if (!existingUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  const diff: Record<string, unknown> = {};

  if (parsed.data.name !== undefined && parsed.data.name !== existingUser.name) {
    updates.name = parsed.data.name.trim();
    diff.name = { from: existingUser.name, to: updates.name };
  }

  if (parsed.data.role !== undefined && parsed.data.role !== existingUser.role) {
    // If demoting from CLINIC_ADMIN, check if there's another active admin
    if (existingUser.role === "CLINIC_ADMIN" && parsed.data.role !== "CLINIC_ADMIN") {
      const adminCount = await prisma.user.count({
        where: { tenantId: session.tenantId!, role: "CLINIC_ADMIN", isActive: true, deletedAt: null, id: { not: id } },
      });
      if (adminCount === 0) {
        return NextResponse.json({ error: "Cannot change role: clinic must have at least one active Clinic Admin" }, { status: 400 });
      }
    }
    updates.role = parsed.data.role;
    diff.role = { from: existingUser.role, to: parsed.data.role };
  }

  if (parsed.data.specialty !== undefined) {
    const val = parsed.data.specialty?.trim() || null;
    if (val !== existingUser.specialty) {
      updates.specialty = val;
      diff.specialty = { from: existingUser.specialty, to: val };
    }
  }

  if (parsed.data.title !== undefined) {
    const val = parsed.data.title?.trim() || null;
    if (val !== existingUser.title) {
      updates.title = val;
      diff.title = { from: existingUser.title, to: val };
    }
  }

  if (parsed.data.branchId !== undefined) {
    const bId = parsed.data.branchId || null;
    if (bId !== existingUser.branchId) {
      if (bId) {
        const branch = await prisma.branch.findFirst({
          where: { id: bId, tenantId: session.tenantId!, deletedAt: null },
        });
        if (!branch) return NextResponse.json({ error: "Invalid branch selected" }, { status: 400 });
      }
      updates.branchId = bId;
      diff.branchId = { from: existingUser.branchId, to: bId };
    }
  }

  if (parsed.data.isActive !== undefined && parsed.data.isActive !== existingUser.isActive) {
    if (existingUser.role === "CLINIC_ADMIN" && !parsed.data.isActive) {
      const adminCount = await prisma.user.count({
        where: { tenantId: session.tenantId!, role: "CLINIC_ADMIN", isActive: true, deletedAt: null, id: { not: id } },
      });
      if (adminCount === 0) {
        return NextResponse.json({ error: "Cannot deactivate the only active Clinic Admin" }, { status: 400 });
      }
    }
    updates.isActive = parsed.data.isActive;
    diff.isActive = { from: existingUser.isActive, to: parsed.data.isActive };
  }

  // Handle email changes
  if (parsed.data.email !== undefined) {
    const newEmail = parsed.data.email?.trim().toLowerCase() || null;
    if (newEmail !== existingUser.email) {
      if (newEmail) {
        const duplicate = await prisma.user.findFirst({
          where: {
            email: { equals: newEmail, mode: "insensitive" },
            id: { not: id },
            deletedAt: null,
          },
        });
        if (duplicate) return NextResponse.json({ error: "Email is already assigned to another user" }, { status: 409 });
      }
      updates.email = newEmail;
      diff.email = { from: existingUser.email, to: newEmail };
    }
  }

  // Handle hasAccess toggle
  if (parsed.data.hasAccess !== undefined) {
    if (!parsed.data.hasAccess) {
      if (existingUser.role === "CLINIC_ADMIN") {
        return NextResponse.json({ error: "Clinic Admins must have dashboard access" }, { status: 400 });
      }
      updates.passwordHash = null;
      diff.hasAccess = { from: true, to: false };
    }
  }

  // Handle password assignment / reset
  if (parsed.data.password && parsed.data.password.trim().length > 0) {
    const effectiveEmail = (updates.email !== undefined ? updates.email : existingUser.email) as string | null;
    if (!effectiveEmail) {
      return NextResponse.json({ error: "An email address is required before setting a password" }, { status: 400 });
    }
    updates.passwordHash = await hashPassword(parsed.data.password);
    diff.passwordReset = true;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ user: existingUser });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updates,
    include: { branch: { select: { id: true, name: true } } },
  });

  await logAudit(prisma, {
    tenantId: session.tenantId!,
    actorId: session.userId,
    action: "UPDATE",
    entity: "User",
    entityId: id,
    diff,
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      specialty: updated.specialty,
      title: updated.title,
      branchId: updated.branchId,
      branchName: updated.branch?.name ?? null,
      isActive: updated.isActive,
      hasPassword: !!updated.passwordHash,
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;
  const { id } = await params;

  if (id === session.userId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { id, tenantId: session.tenantId!, deletedAt: null },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.role === "CLINIC_ADMIN") {
    const remainingAdmins = await prisma.user.count({
      where: { tenantId: session.tenantId!, role: "CLINIC_ADMIN", isActive: true, deletedAt: null, id: { not: id } },
    });
    if (remainingAdmins === 0) {
      return NextResponse.json({ error: "Cannot delete the only active Clinic Admin" }, { status: 400 });
    }
  }

  // Soft-delete to preserve all clinical notes, appointments, invoices and sessions.
  // Mangle email so the original email address can be re-registered immediately if needed.
  const mangledEmail = user.email ? `${user.email}.deleted.${Date.now()}` : null;

  await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      email: mangledEmail,
      passwordHash: null,
    },
  });

  await logAudit(prisma, {
    tenantId: session.tenantId!,
    actorId: session.userId,
    action: "DELETE",
    entity: "User",
    entityId: id,
    diff: { name: user.name, email: user.email, role: user.role },
  });

  return NextResponse.json({ ok: true });
}
