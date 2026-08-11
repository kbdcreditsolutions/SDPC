import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { redirect } from "next/navigation";
import DuplicatesClient from "./DuplicatesClient";

export const metadata = { title: "Duplicate Patients" };

export default async function DuplicatesPage() {
  const { session, db } = await requireSession(["CLINIC_ADMIN"]);
  if (!session) redirect("/admin/login");

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
      _count: {
        select: {
          packages: { where: { deletedAt: null } },
          invoices: { where: { deletedAt: null } },
          packageSessions: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const groupMap = new Map<string, typeof patients>();
  for (const p of patients) {
    const firstName = p.name.trim().split(/\s+/)[0].toLowerCase();
    const key = `${p.phone.trim()}:${firstName}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(p);
  }

  const groups = [...groupMap.values()]
    .filter((g) => g.length > 1)
    .map((group) => {
      const sorted = [...group].sort((a, b) => {
        const aNum = a.pid ? parseInt(a.pid.replace(/\D/g, ""), 10) : Infinity;
        const bNum = b.pid ? parseInt(b.pid.replace(/\D/g, ""), 10) : Infinity;
        if (aNum !== bNum) return aNum - bNum;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
      return {
        canonical: { ...sorted[0], createdAt: sorted[0].createdAt.toISOString() },
        duplicates: sorted.slice(1).map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
      };
    });

  return <DuplicatesClient initialGroups={groups} />;
}
