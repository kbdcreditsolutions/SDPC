import { NextResponse } from "next/server";
import { getSession, Role } from "@/lib/auth";

export async function requireSession(allowedRoles?: Role[]) {
  const session = await getSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { session: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, response: null };
}
