import { StatCard, Card } from "@/components/Card";
import { DashboardRevenueChart, DashboardBranchChart } from "@/components/admin/DashboardCharts";
import { getDashboardData } from "@/lib/queries/dashboard";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const LEAD_LABELS: Record<string, string> = {
  DIRECT: "Direct",
  REFERRAL: "Referral",
  GOOGLE: "Google",
  FACEBOOK: "Facebook",
  WALK_IN: "Walk-in",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return <p className="text-sm text-ink/50">Unable to load dashboard data.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-ink/60">Real-time pulse of your clinic.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's revenue"
          value={inr(data.todayRevenue)}
          sub={`Total ${inr(data.totalBilled)}`}
        />
        <StatCard
          label="Patients"
          value={String(data.patientsCount)}
          sub={`${data.doctorsCount} doctors · ${data.staffCount} active staff`}
        />
        <StatCard
          label="Today's appointments"
          value={String(data.todayAppointmentsCount)}
          sub={`${data.upcomingApptsCount} upcoming`}
        />
        <StatCard
          label="Outstanding"
          value={inr(data.outstanding)}
          sub={`Billed ${inr(data.totalBilled)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">
            Last 30 days
          </p>
          <p className="mt-1 font-display text-lg">Revenue trend</p>
          <div className="mt-4 h-56">
            <DashboardRevenueChart data={data.revenueTrend} />
          </div>
        </Card>

        <Card>
          <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">
            Lead attribution
          </p>
          <p className="mt-1 font-display text-lg">Where patients come from</p>
          <ul className="mt-5 grid grid-cols-2 gap-y-3 text-sm">
            {Object.entries(data.leadCounts).map(([key, count]) => (
              <li key={key} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-forest" />
                {LEAD_LABELS[key] ?? key}
                <span className="ml-auto font-data text-ink/60">{count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">Doctors</p>
          <p className="mt-1 font-display text-lg">Performance leaderboard</p>
          <ol className="mt-4 space-y-3">
            {data.doctorLeaderboard.map((d, i) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-data text-ink/40">{i + 1}</span>
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-ink/50">
                      {d.specialty ?? "—"} · {d.patients} patients
                    </div>
                  </div>
                </div>
                <span className="font-data">{inr(d.revenue)}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">Branches</p>
          <p className="mt-1 font-display text-lg">Revenue by branch</p>
          <div className="mt-4 h-56">
            <DashboardBranchChart data={data.revenueByBranch} />
          </div>
        </Card>
      </div>
    </div>
  );
}
