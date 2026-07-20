import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import type { SessionPayload } from "@/lib/auth";
import {
  istDateKey,
  istDayBounds,
  addDaysToKey,
  fyStartYearFor,
  financialYearRange,
  previousFinancialYearRange,
} from "@/lib/istDate";

export { istDateKey, istDayBounds, addDaysToKey, financialYearRange, previousFinancialYearRange };

export type DateRange = { from: Date; to: Date };

export type DashboardData = {
  // Fixed, always-on figures — not affected by the range filter
  todayRevenue: number;
  totalBilled: number;
  patientsCount: number;
  doctorsCount: number;
  staffCount: number;
  todayAppointmentsCount: number;
  upcomingApptsCount: number;
  outstanding: number;
  fyRevenue: number;
  fyNewPatients: number;
  lastFyRevenue: number;
  fyLabel: string;
  // Range-scoped figures — recomputed for whatever range the caller passes
  range: { from: string; to: string };
  rangeRevenue: number;
  rangeNewPatients: number;
  yesterdayRevenue: number;
  previousRangeRevenue: number;
  previousRangeNewPatients: number;
  revenueTrend: { date: string; revenue: number }[];
  leadCounts: Record<string, number>;
  doctorLeaderboard: { id: string; name: string; specialty: string | null; patients: number; revenue: number }[];
  revenueByBranch: { name: string; revenue: number }[];
};

/**
 * `range.from`/`range.to` must already be exact UTC instants marking the
 * intended IST-calendar-day boundaries (see `istDayBounds`) — this function
 * does not re-normalize them, to avoid re-introducing server-timezone bugs.
 */
async function computeDashboardData(
  scope: ReturnType<typeof tenantScope>,
  range: DateRange
): Promise<DashboardData> {
  const now = new Date();
  const todayKey = istDateKey(now);
  const { start: today0, end: today1 } = istDayBounds(todayKey);
  const { start: yesterday0, end: yesterday1 } = istDayBounds(addDaysToKey(todayKey, -1));
  const from = range.from;
  const to = range.to;
  // Same-length window immediately preceding the selected range, for period-over-period trend.
  const prevTo = new Date(from.getTime());
  const prevFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));
  const { start: fyStart } = financialYearRange(now);
  const { start: lastFyStart, end: lastFyEnd } = previousFinancialYearRange(now);

  const [
    todayPayments,
    allInvoices,
    patientsCount,
    doctorsCount,
    staffCount,
    todayAppts,
    upcomingApptsCount,
    fyPayments,
    fyNewPatients,
    lastFyPayments,
    rangePatients,
    rangeNewPatients,
    rangePayments,
    doctors,
    branches,
    yesterdayPayments,
    previousRangePayments,
    previousRangeNewPatients,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: { date: { gte: today0, lte: today1 }, invoice: { ...scope, deletedAt: null } },
    }),
    prisma.invoice.findMany({ where: { ...scope, deletedAt: null } }),
    prisma.patient.count({ where: { ...scope, deletedAt: null } }),
    prisma.user.count({ where: { ...scope, role: "DOCTOR", isActive: true, deletedAt: null } }),
    prisma.user.count({ where: { ...scope, role: "STAFF", isActive: true, deletedAt: null } }),
    prisma.appointment.findMany({
      where: { ...scope, datetime: { gte: today0, lte: today1 }, deletedAt: null },
    }),
    prisma.appointment.count({
      where: { ...scope, datetime: { gt: now }, status: "SCHEDULED", deletedAt: null },
    }),
    prisma.payment.findMany({
      where: { date: { gte: fyStart, lte: now }, invoice: { ...scope, deletedAt: null } },
      select: { amount: true },
    }),
    prisma.patient.count({ where: { ...scope, deletedAt: null, createdAt: { gte: fyStart, lte: now } } }),
    prisma.payment.findMany({
      where: { date: { gte: lastFyStart, lte: lastFyEnd }, invoice: { ...scope, deletedAt: null } },
      select: { amount: true },
    }),
    prisma.patient.findMany({
      where: { ...scope, deletedAt: null, createdAt: { gte: from, lte: to } },
      select: { leadSource: true },
    }),
    prisma.patient.count({ where: { ...scope, deletedAt: null, createdAt: { gte: from, lte: to } } }),
    prisma.payment.findMany({
      where: { date: { gte: from, lte: to }, invoice: { ...scope, deletedAt: null } },
      select: { amount: true, date: true },
    }),
    prisma.user.findMany({
      where: { ...scope, role: "DOCTOR", deletedAt: null },
      include: {
        appointments: { where: { deletedAt: null }, select: { patientId: true } },
      },
    }),
    prisma.branch.findMany({
      where: { ...scope, deletedAt: null },
      include: {
        patients: {
          where: { deletedAt: null },
          include: {
            invoices: { where: { deletedAt: null, date: { gte: from, lte: to } } },
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: { date: { gte: yesterday0, lte: yesterday1 }, invoice: { ...scope, deletedAt: null } },
      select: { amount: true },
    }),
    prisma.payment.findMany({
      where: { date: { gte: prevFrom, lt: prevTo }, invoice: { ...scope, deletedAt: null } },
      select: { amount: true },
    }),
    prisma.patient.count({ where: { ...scope, deletedAt: null, createdAt: { gte: prevFrom, lt: prevTo } } }),
  ]);

  const todayRevenue = todayPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalBilled = allInvoices.reduce((s, i) => s + Number(i.total), 0);
  const outstanding = allInvoices.reduce((s, i) => s + (Number(i.total) - Number(i.paidAmount)), 0);
  const fyRevenue = fyPayments.reduce((s, p) => s + Number(p.amount), 0);
  const lastFyRevenue = lastFyPayments.reduce((s, p) => s + Number(p.amount), 0);
  const rangeRevenue = rangePayments.reduce((s, p) => s + Number(p.amount), 0);
  const yesterdayRevenue = yesterdayPayments.reduce((s, p) => s + Number(p.amount), 0);
  const previousRangeRevenue = previousRangePayments.reduce((s, p) => s + Number(p.amount), 0);

  const leadCounts: Record<string, number> = {};
  for (const p of rangePatients) {
    const key = p.leadSource ?? "DIRECT";
    leadCounts[key] = (leadCounts[key] ?? 0) + 1;
  }

  const trendMap: Record<string, number> = {};
  for (const p of rangePayments) {
    const key = istDateKey(p.date);
    trendMap[key] = (trendMap[key] ?? 0) + Number(p.amount);
  }
  const revenueTrend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));

  // Invoices dated within the selected range, attributed to whichever doctor
  // has ever seen that patient (matches the pre-existing leaderboard logic).
  const rangeInvoicesByPatient = new Map<string, number>();
  for (const inv of allInvoices) {
    if (inv.date < from || inv.date > to) continue;
    rangeInvoicesByPatient.set(
      inv.patientId,
      (rangeInvoicesByPatient.get(inv.patientId) ?? 0) + Number(inv.total)
    );
  }

  const doctorLeaderboard = doctors
    .map((d) => {
      const patientIds = new Set<string>(d.appointments.map((a) => a.patientId as string));
      const revenue = [...patientIds].reduce(
        (s: number, pid: string) => s + (rangeInvoicesByPatient.get(pid) ?? 0),
        0
      );
      return { id: d.id, name: d.name, specialty: d.specialty, patients: patientIds.size, revenue };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const revenueByBranch = branches
    .map((b) => ({
      name: b.name,
      revenue: b.patients.reduce(
        (s: number, p) => s + p.invoices.reduce((si: number, i) => si + Number(i.total), 0),
        0
      ),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    todayRevenue,
    totalBilled,
    patientsCount,
    doctorsCount,
    staffCount,
    todayAppointmentsCount: todayAppts.length,
    upcomingApptsCount,
    outstanding,
    fyRevenue,
    fyNewPatients,
    lastFyRevenue,
    fyLabel: `FY ${fyStartYearFor(now)}-${String((fyStartYearFor(now) + 1) % 100).padStart(2, "0")}`,
    range: { from: from.toISOString(), to: to.toISOString() },
    rangeRevenue,
    rangeNewPatients,
    yesterdayRevenue,
    previousRangeRevenue,
    previousRangeNewPatients,
    revenueTrend,
    leadCounts,
    doctorLeaderboard,
    revenueByBranch,
  };
}

export async function getDashboardData(range?: DateRange): Promise<DashboardData | null> {
  const { session } = await requireSession();
  if (!session) return null;

  const scope = tenantScope(session);
  const now = new Date();
  const todayKey = istDateKey(now);
  const defaultFromKey = addDaysToKey(todayKey, -30);

  const defaultRange: DateRange = {
    from: istDayBounds(defaultFromKey).start,
    to: istDayBounds(todayKey).end,
  };

  return computeDashboardData(scope, range ?? defaultRange);
}

export async function getDashboardDataForSession(
  session: SessionPayload,
  range: DateRange
): Promise<DashboardData> {
  const scope = tenantScope(session);
  return computeDashboardData(scope, range);
}
