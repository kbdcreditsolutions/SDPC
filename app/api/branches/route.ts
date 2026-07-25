import { NextResponse } from "next/server";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

export async function GET() {
  const { session, response, db } = await requireSession();
  if (!session) return response!;
  const scope = tenantScope(session);

  const branches = await db!.branch.findMany({
    where: { ...scope, deletedAt: null },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ branches });
}
