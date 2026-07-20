import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

export async function GET() {
  const { session, response } = await requireSession();
  if (!session) return response!;
  const scope = tenantScope(session);

  const branches = await prisma.branch.findMany({
    where: { ...scope, deletedAt: null },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ branches });
}
