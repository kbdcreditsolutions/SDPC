import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { zodErrorMessage } from "@/lib/zodError";

export async function GET() {
  const { session, response } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;
  const scope = tenantScope(session);

  const [users, branches] = await Promise.all([
    prisma.user.findMany({
      where: { ...scope, deletedAt: null },
      include: { branch: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({
      where: { tenantId: session.tenantId!, deletedAt: null },
      select: { id: true, name: true, city: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      specialty: u.specialty,
      title: u.title,
      branchId: u.branchId,
      branchName: u.branch?.name ?? null,
      isActive: u.isActive,
      hasPassword: !!u.passwordHash,
      createdAt: u.createdAt.toISOString(),
    })),
    branches,
  });
}

const createSchema = z
  .object({
    name: z.string().trim().min(1, "Full name is required"),
    role: z.enum(["CLINIC_ADMIN", "DOCTOR", "STAFF"]),
    specialty: z.string().trim().optional(),
    title: z.string().trim().optional(),
    branchId: z.string().nullable().optional(),
    hasAccess: z.boolean(),
    email: z.union([z.literal(""), z.string().email()]).optional(),
    password: z.union([z.literal(""), z.string().min(6, "Password must be at least 6 characters")]).optional(),
  })
  .refine((data) => data.role !== "CLINIC_ADMIN" || data.hasAccess, {
    message: "Clinic Admins must have dashboard access",
    path: ["hasAccess"],
  })
  .refine((data) => !data.hasAccess || (!!data.email && data.email.trim().length > 0), {
    message: "Email is required to grant dashboard access",
    path: ["email"],
  })
  .refine((data) => !data.hasAccess || (!!data.password && data.password.length >= 6), {
    message: "Password (min 6 characters) is required to grant dashboard access",
    path: ["password"],
  });

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  const { hasAccess, email, password, branchId, name, role, specialty, title } = parsed.data;

  // Verify branch belongs to tenant if specified (per tenant isolation rule)
  if (branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, tenantId: session.tenantId!, deletedAt: null },
    });
    if (!branch) {
      return NextResponse.json({ error: "Invalid branch selected" }, { status: 400 });
    }
  }

  let normalizedEmail: string | null = null;
  if (hasAccess && email && email.trim()) {
    normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
        deletedAt: null,
      },
    });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      tenantId: session.tenantId!,
      name: name.trim(),
      role,
      specialty: specialty?.trim() || null,
      title: title?.trim() || null,
      branchId: branchId || null,
      email: normalizedEmail,
      passwordHash: hasAccess && password ? await hashPassword(password) : null,
      isActive: true,
    },
    include: { branch: { select: { id: true, name: true } } },
  });

  await logAudit(prisma, {
    tenantId: session.tenantId!,
    actorId: session.userId,
    action: "CREATE",
    entity: "User",
    entityId: user.id,
    diff: { name: user.name, role: user.role, email: user.email, specialty: user.specialty },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialty: user.specialty,
      title: user.title,
      branchId: user.branchId,
      branchName: user.branch?.name ?? null,
      isActive: user.isActive,
      hasPassword: !!user.passwordHash,
    },
  });
}
