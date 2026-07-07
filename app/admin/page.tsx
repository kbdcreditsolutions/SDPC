"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, StatCard } from "@/components/Card";

type DashboardData = {
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <p className="text-sm text-ink/50">Loading dashboard…</p>;
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueTrend}>
                <CartesianGrid stroke="var(--sand)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  tick={{ fontSize: 11, fill: "var(--sage)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "var(--sage)" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => inr(Number(v))} />
                <Line type="monotone" dataKey="revenue" stroke="var(--forest)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByBranch}>
                <CartesianGrid stroke="var(--sand)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--sage)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--sage)" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => inr(Number(v))} />
                <Bar dataKey="revenue" fill="var(--forest)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
