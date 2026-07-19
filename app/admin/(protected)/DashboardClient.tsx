"use client";

import { useState } from "react";
import { StatCard, Card } from "@/components/Card";
import { DashboardRevenueChart, DashboardBranchChart } from "@/components/admin/DashboardCharts";
import type { DashboardData } from "@/lib/queries/dashboard";
import { istDateKey, addDaysToKey, istMonthStartKey, fyStartYearFor } from "@/lib/istDate";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const LEAD_LABELS: Record<string, string> = {
  DIRECT: "Direct",
  REFERRAL: "Doctor Referral",
  GOOGLE: "Google",
  FACEBOOK: "Facebook",
  WALK_IN: "Walk-In",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  PATIENT_REFERRAL: "Friend/Family Referral",
  FLYERS: "Flyers",
  HOARDINGS: "Hoardings",
  TV_ADS: "TV Ads",
  CINEMA_ADS: "Cinema Theatre Ads",
  NEWSPAPER_AD: "Newspaper Ad",
};

// IST-aware, not browser-local — a staff member on a non-IST device must
// still see "Today" mean the clinic's actual IST business day.
const localDate = (d: Date) => istDateKey(d);

type Preset = "today" | "7d" | "30d" | "month" | "fy" | "lastFy" | "custom";

const PRESET_LABELS: Record<Preset, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
  fy: "This financial year",
  lastFy: "Last financial year",
  custom: "Custom range",
};

function rangeForPreset(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const todayKey = istDateKey(now);
  switch (preset) {
    case "today":
      return { from: todayKey, to: todayKey };
    case "7d":
      return { from: addDaysToKey(todayKey, -7), to: todayKey };
    case "month":
      return { from: istMonthStartKey(now), to: todayKey };
    case "fy": {
      const fyStartYear = fyStartYearFor(now);
      return { from: `${fyStartYear}-04-01`, to: todayKey };
    }
    case "lastFy": {
      const fyStartYear = fyStartYearFor(now);
      return { from: `${fyStartYear - 1}-04-01`, to: `${fyStartYear}-03-31` };
    }
    case "30d":
    default:
      return { from: addDaysToKey(todayKey, -30), to: todayKey };
  }
}

export default function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [preset, setPreset] = useState<Preset>("30d");
  const [customFrom, setCustomFrom] = useState(localDate(new Date(Date.now() - 30 * 86400000)));
  const [customTo, setCustomTo] = useState(localDate(new Date()));
  const [loading, setLoading] = useState(false);

  async function applyRange(from: string, to: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/?from=${from}&to=${to}`);
      if (!res.ok) return;
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function handlePresetChange(next: Preset) {
    setPreset(next);
    if (next === "custom") return;
    const { from, to } = rangeForPreset(next);
    applyRange(from, to);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-ink/60">Real-time pulse of your clinic.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value as Preset)}
            className="rounded-lg border border-sand bg-white px-3 py-2 text-sm"
          >
            {Object.entries(PRESET_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {preset === "custom" && (
            <>
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-sand bg-white px-3 py-2 text-sm"
              />
              <span className="text-sm text-ink/40">to</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={localDate(new Date())}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-sand bg-white px-3 py-2 text-sm"
              />
              <button
                onClick={() => applyRange(customFrom, customTo)}
                disabled={loading}
                className="rounded-lg bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-60"
              >
                Apply
              </button>
            </>
          )}
          {loading && <span className="text-xs text-ink/40">Loading…</span>}
        </div>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`${data.fyLabel} revenue (YTD)`}
          value={inr(data.fyRevenue)}
          sub={
            data.lastFyRevenue > 0
              ? `${data.fyRevenue >= data.lastFyRevenue ? "+" : ""}${Math.round(
                  ((data.fyRevenue - data.lastFyRevenue) / data.lastFyRevenue) * 100
                )}% vs last FY`
              : "No data for last FY"
          }
        />
        <StatCard
          label={`${data.fyLabel} new patients`}
          value={String(data.fyNewPatients)}
          sub="Since 1 April"
        />
        <StatCard
          label="Selected range revenue"
          value={inr(data.rangeRevenue)}
          sub={PRESET_LABELS[preset]}
        />
        <StatCard
          label="Selected range new patients"
          value={String(data.rangeNewPatients)}
          sub={PRESET_LABELS[preset]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">
            {PRESET_LABELS[preset]}
          </p>
          <p className="mt-1 font-display text-lg">Revenue trend</p>
          <div className="mt-4 h-56">
            <DashboardRevenueChart data={data.revenueTrend} />
          </div>
        </Card>

        <Card>
          <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">
            Lead attribution · {PRESET_LABELS[preset]}
          </p>
          <p className="mt-1 font-display text-lg">Where patients come from</p>
          {Object.keys(data.leadCounts).length === 0 ? (
            <p className="mt-5 text-sm text-ink/40">No new patients in this range.</p>
          ) : (
            <ul className="mt-5 space-y-3 text-sm">
              {(() => {
                const total = Object.values(data.leadCounts).reduce((s, n) => s + n, 0);
                return Object.entries(data.leadCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, count]) => {
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <li key={key}>
                        <div className="flex items-center justify-between">
                          <span>{LEAD_LABELS[key] ?? key}</span>
                          <span className="font-data text-ink/60">{count}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand">
                          <div className="h-full rounded-full bg-forest" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  });
              })()}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">
            Doctors · {PRESET_LABELS[preset]}
          </p>
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
          <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">
            Branches · {PRESET_LABELS[preset]}
          </p>
          <p className="mt-1 font-display text-lg">Revenue by branch</p>
          <div className="mt-4 h-56">
            <DashboardBranchChart data={data.revenueByBranch} />
          </div>
        </Card>
      </div>
    </div>
  );
}
