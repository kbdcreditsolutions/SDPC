import { requireSession } from "@/lib/guard";
import { tenantScope } from "@/lib/scope";
import { istDateKey, istDayBounds } from "@/lib/istDate";

export type TodayPackage = {
  id: string;
  name: string;
  totalSessions: number;
  usedSessions: number;
};

export type TodayAppointment = {
  id: string;
  datetime: string;
  status: string;
  patient: { id: string; name: string; phone: string; pid: string | null; reason: string | null };
  doctor: { id: string; name: string };
  packages: TodayPackage[];
};

export type TodayLoggedSession = {
  id: string;
  date: string;
  patient: { id: string; name: string };
  doctor: { id: string; name: string } | null;
  package: { name: string; totalSessions: number; usedSessions: number };
};

export type TodayData = {
  dateKey: string;
  appointments: TodayAppointment[];
  logged: TodayLoggedSession[];
};

/**
 * Everything the Today screen needs for one IST business day: who is booked,
 * what has already been logged, and (per booked patient) which packages a
 * session could be logged against — so the UI can offer a single tap when
 * there's exactly one active package and only ask when it's genuinely ambiguous.
 */
export async function getToday(): Promise<TodayData> {
  const { session, db } = await requireSession();
  const dateKey = istDateKey(new Date());
  // No session, or a session with no clinic (SUPER_ADMIN): `db` is null in that
  // second case, so returning early beats a TypeError dressed up as a 500.
  if (!session || !session.tenantId) return { dateKey, appointments: [], logged: [] };

  const scope = tenantScope(session);
  const { start, end } = istDayBounds(dateKey);
  // A DOCTOR only ever sees their own day, matching getAppointments/getPackageSessions.
  const doctorScope = session.role === "DOCTOR" ? { doctorId: session.userId } : {};

  const [appointments, logged] = await Promise.all([
    db!.appointment.findMany({
      where: {
        ...scope,
        ...doctorScope,
        deletedAt: null,
        // Patient soft-delete doesn't cascade to appointments, so filter here
        // or a deleted patient renders as a bookable row.
        patient: { deletedAt: null },
        datetime: { gte: start, lte: end },
      },
      include: {
        patient: { select: { id: true, name: true, phone: true, pid: true, reason: true } },
        doctor: { select: { id: true, name: true } },
      },
      orderBy: { datetime: "asc" },
    }),
    db!.packageSession.findMany({
      where: {
        ...scope,
        ...doctorScope,
        deletedAt: null,
        // Same reason as the appointment filter above: a deleted patient would
        // otherwise show in "Logged today" linking to a dead record.
        patient: { deletedAt: null },
        date: { gte: start, lte: end },
      },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
        package: { select: { name: true, totalSessions: true, usedSessions: true } },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const patientIds = [...new Set(appointments.map((a) => a.patientId))];
  const packages = patientIds.length
    ? await db!.package.findMany({
        where: { patientId: { in: patientIds }, ...scope, deletedAt: null, status: "ACTIVE" },
        select: { id: true, patientId: true, name: true, totalSessions: true, usedSessions: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const byPatient = new Map<string, TodayPackage[]>();
  for (const p of packages) {
    const list = byPatient.get(p.patientId) ?? [];
    // Exhausted packages can't take another session — hide them so the UI
    // doesn't offer a tap that the API would reject.
    if (p.usedSessions < p.totalSessions) {
      list.push({ id: p.id, name: p.name, totalSessions: p.totalSessions, usedSessions: p.usedSessions });
    }
    byPatient.set(p.patientId, list);
  }

  return {
    dateKey,
    appointments: appointments.map((a) => ({
      id: a.id,
      datetime: a.datetime.toISOString(),
      status: a.status,
      patient: a.patient,
      doctor: a.doctor,
      packages: byPatient.get(a.patientId) ?? [],
    })),
    logged: logged.map((s) => ({
      id: s.id,
      date: s.date.toISOString(),
      patient: s.patient,
      doctor: s.doctor,
      package: s.package,
    })),
  };
}
