import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export type DashboardData = {
  todayRevenue: number;
  totalBilled: number;
  patientsCount: number;
  doctorsCount: number;
  staffCount: number;
  todayAppointmentsCount: number;
  upcomingApptsCount: number;
  outstanding: number;
  revenueTrend: { date: string; revenue: number }[];
  leadCounts: Record<string, number>;
  doctorLeaderboard: { id: string; name: string; specialty: string | null; patients: number; revenue: number }[];
  revenueByBranch: { name: string; revenue: number }[];
};

export async function getDashboardData(): Promise<DashboardData | null> {
  const { session } = await requireSession();
  if (!session) return null;

  const scope = tenantScope(session);
  const now = new Date();
  const today0 = startOfDay(now);
  const today1 = endOfDay(now);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    todayPayments,
    allInvoices,
    patientsCount,
    doctorsCount,
    staffCount,
    todayAppts,
    upcomingApptsCount,
    patients,
    recentPayments,
    doctors,
    branches,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: { date: { gte: today0, lte: today1 }, invoice: { ...scope } },
    }),
    prisma.invoice.findMany({ where: scope }),
    prisma.patient.count({ where: scope }),
    prisma.user.count({ where: { ...scope, role: "DOCTOR", isActive: true } }),
    prisma.user.count({ where: { ...scope, role: "STAFF", isActive: true } }),
    prisma.appointment.findMany({
      where: { ...scope, datetime: { gte: today0, lte: today1 } },
    }),
    prisma.appointment.count({
      where: { ...scope, datetime: { gt: now }, status: "SCHEDULED" },
    }),
    prisma.patient.findMany({ where: scope, select: { leadSource: true } }),
    prisma.payment.findMany({
      where: { date: { gte: thirtyDaysAgo }, invoice: { ...scope } },
      select: { amount: true, date: true },
    }),
    prisma.user.findMany({
      where: { ...scope, role: "DOCTOR" },
      include: {
        appointments: { select: { patientId: true } },
      },
    }),
    prisma.branch.findMany({
      where: scope,
      include: { patients: { include: { invoices: true } } },
    }),
  ]);

  const todayRevenue = todayPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalBilled = allInvoices.reduce((s, i) => s + Number(i.total), 0);
  const outstanding = allInvoices.reduce(
    (s, i) => s + (Number(i.total) - Number(i.paidAmount)),
    0
  );

  const leadCounts: Record<string, number> = {};
  for (const p of patients) {
    const key = p.leadSource ?? "DIRECT";
    leadCounts[key] = (leadCounts[key] ?? 0) + 1;
  }

  const trendMap: Record<string, number> = {};
  for (const p of recentPayments) {
    const key = p.date.toISOString().slice(0, 10);
    trendMap[key] = (trendMap[key] ?? 0) + Number(p.amount);
  }
  const revenueTrend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));

  const invoicesByPatient = new Map<string, number>();
  for (const inv of allInvoices) {
    invoicesByPatient.set(
      inv.patientId,
      (invoicesByPatient.get(inv.patientId) ?? 0) + Number(inv.total)
    );
  }

  const doctorLeaderboard = doctors
    .map((d) => {
      const patientIds = new Set<string>(d.appointments.map((a) => a.patientId as string));
      const revenue = [...patientIds].reduce(
        (s: number, pid: string) => s + (invoicesByPatient.get(pid) ?? 0),
        0
      );
      return { id: d.id, name: d.name, specialty: d.specialty, patients: patientIds.size, revenue };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const revenueByBranch = branches.map((b) => ({
    name: b.name,
    revenue: b.patients.reduce(
      (s: number, p) => s + p.invoices.reduce((si: number, i) => si + Number(i.total), 0),
      0
    ),
  }));

  return {
    todayRevenue,
    totalBilled,
    patientsCount,
    doctorsCount,
    staffCount,
    todayAppointmentsCount: todayAppts.length,
    upcomingApptsCount,
    outstanding,
    revenueTrend,
    leadCounts,
    doctorLeaderboard,
    revenueByBranch,
  };
}
