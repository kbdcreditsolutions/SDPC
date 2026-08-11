import { NextResponse } from "next/server";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

export async function GET() {
  const { session, response, db } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) return response!;

  const patients = await db!.patient.findMany({
    where: { ...tenantScope(session), deletedAt: null },
    select: {
      id: true,
      name: true,
      phone: true,
      pid: true,
      age: true,
      gender: true,
      createdAt: true,
      _count: { select: { packages: { where: { deletedAt: null } }, invoices: { where: { deletedAt: null } }, packageSessions: { where: { deletedAt: null } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by phone + first word of name (case-insensitive). Families share phones
  // so first-name matching filters siblings from true duplicates.
  const groups = new Map<string, typeof patients>();
  for (const p of patients) {
    const firstName = p.name.trim().split(/\s+/)[0].toLowerCase();
    const key = `${p.phone.trim()}:${firstName}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  const duplicates = [...groups.values()]
    .filter((g) => g.length > 1)
    .map((group) => {
      // Canonical = lowest pid number, then earliest createdAt.
      const sorted = [...group].sort((a, b) => {
        const aNum = a.pid ? parseInt(a.pid.replace(/\D/g, ""), 10) : Infinity;
        const bNum = b.pid ? parseInt(b.pid.replace(/\D/g, ""), 10) : Infinity;
        if (aNum !== bNum) return aNum - bNum;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
      return { canonical: sorted[0], duplicates: sorted.slice(1) };
    });

  return NextResponse.json({ groups: duplicates });
}
