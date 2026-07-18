import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const { session, response } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;
  const scope = tenantScope(session);

  const users = await prisma.user.findMany({
    where: { ...scope, deletedAt: null },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      specialty: u.specialty,
      isActive: u.isActive,
    })),
  });
}

const schema = z
  .object({
    name: z.string().min(1),
    role: z.enum(["CLINIC_ADMIN", "DOCTOR", "STAFF"]),
    specialty: z.string().optional(),
    hasAccess: z.boolean(),
    email: z.union([z.literal(""), z.string().email()]).optional(),
    password: z.union([z.literal(""), z.string().min(8)]).optional(),
  })
  .refine((data) => data.role !== "CLINIC_ADMIN" || data.hasAccess, {
    message: "Clinic Admins must have dashboard access",
    path: ["hasAccess"],
  })
  .refine((data) => !data.hasAccess || !!data.email, {
    message: "Email is required to grant dashboard access",
    path: ["email"],
  })
  .refine((data) => !data.hasAccess || !!data.password, {
    message: "Password is required to grant dashboard access",
    path: ["password"],
  });

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const { hasAccess, email, password, ...rest } = parsed.data;

  if (hasAccess && email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      tenantId: session.tenantId!,
      ...rest,
      email: hasAccess ? email : null,
      passwordHash: hasAccess && password ? await hashPassword(password) : null,
    },
  });

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
