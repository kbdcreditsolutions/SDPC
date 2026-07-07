import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const { session, response } = await requireSession();
  if (!session) return response!;
  const scope = tenantScope(session);

  const users = await prisma.user.findMany({
    where: scope,
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

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["CLINIC_ADMIN", "DOCTOR", "STAFF"]),
  specialty: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      tenantId: session.tenantId!,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role,
      specialty: parsed.data.specialty,
    },
  });

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
