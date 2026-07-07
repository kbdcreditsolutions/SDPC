import { NextResponse } from "next/server";
import { getSession, Role } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function requireSession(allowedRoles?: Role[]) {
  const session = await getSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { session: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  // Verify user is still active (token revocation via DB check)
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { isActive: true } });
  if (!user?.isActive) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}
