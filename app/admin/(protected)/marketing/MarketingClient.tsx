"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, StatCard } from "@/components/Card";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function MarketingClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState<any>(initialData);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "CAMPAIGN",
    startDate: "",
    endDate: "",
    cost: "",
    leads: "",
    conversions: "",
    revenue: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/marketing/");
    const json = await res.json();
    setData(json);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/campaigns/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to save campaign");
        return;
      }
      
      setShowForm(false);
      setForm({ name: "", type: "CAMPAIGN", startDate: "", endDate: "", cost: "", leads: "", conversions: "", revenue: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <p className="text-sm text-ink/70">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Marketing &amp; Workshops</h1>
          <p className="mt-1 text-sm text-ink/60">Campaigns, referrals &amp; ROI tracking</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep"
        >
          + New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total spend" value={inr(data.totalSpend)} />
        <StatCard label="Revenue attributed" value={inr(data.revenueAttributed)} />
        <StatCard label="Overall ROI" value={`${data.overallRoi}%`} />
        <StatCard label="Total leads" value={String(data.totalLeads)} />
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-sand px-3 py-2 text-sm" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-sand px-3 py-2 text-sm">
              <option value="CAMPAIGN">Campaign</option>
              <option value="WORKSHOP">Workshop</option>
            </select>
            <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-lg border border-sand px-3 py-2 text-sm" />
            <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="rounded-lg border border-sand px-3 py-2 text-sm" />
            <input required type="number" placeholder="Cost" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="rounded-lg border border-sand px-3 py-2 text-sm" />
            <input type="number" placeholder="Leads" value={form.leads} onChange={(e) => setForm({ ...form, leads: e.target.value })} className="rounded-lg border border-sand px-3 py-2 text-sm" />
            <input type="number" placeholder="Conversions" value={form.conversions} onChange={(e) => setForm({ ...form, conversions: e.target.value })} className="rounded-lg border border-sand px-3 py-2 text-sm" />
            <input type="number" placeholder="Revenue" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} className="rounded-lg border border-sand px-3 py-2 text-sm" />
            <div className="col-span-full flex gap-3">
              <button disabled={saving} className="rounded-lg bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-60">
                {saving ? "Saving…" : "Save campaign"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-5 py-2 text-sm text-ink/60 hover:bg-sand/60">
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <div>
        <p className="mb-3 text-sm font-medium">Campaigns &amp; workshops</p>
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand text-left text-[10px] uppercase tracking-widest text-ink/65">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3">Cost</th>
                <th className="px-6 py-3">Leads</th>
                <th className="px-6 py-3">Conv.</th>
                <th className="px-6 py-3">Revenue</th>
                <th className="px-6 py-3">ROI</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c: any) => (
                <tr key={c.id} className="border-b border-sand/60 last:border-0">
                  <td className="px-6 py-3 font-medium">{c.name}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-sand px-2 py-0.5 text-xs">{c.type.toLowerCase()}</span>
                  </td>
                  <td className="px-6 py-3 text-xs text-ink/60">
                    {fmtDate(c.startDate)} – {fmtDate(c.endDate)}
                  </td>
                  <td className="px-6 py-3 font-data">{inr(c.cost)}</td>
                  <td className="px-6 py-3 font-data">{c.leads}</td>
                  <td className="px-6 py-3 font-data">
                    {c.conversions} ({c.leads > 0 ? Math.round((c.conversions / c.leads) * 100) : 0}%)
                  </td>
                  <td className="px-6 py-3 font-data">{inr(c.revenue)}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-forest/10 px-2 py-0.5 font-data text-xs text-forest">
                      {c.roi}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Referrals</p>
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand text-left text-[10px] uppercase tracking-widest text-ink/65">
                <th className="px-6 py-3">Referrer</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Revenue generated</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.referrals.map((r: any) => (
                <tr key={r.id} className="border-b border-sand/60 last:border-0">
                  <td className="px-6 py-3">{r.referrerName}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-clay-light px-2 py-0.5 text-xs text-clay">
                      {r.type.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-data">{inr(r.revenueGenerated)}</td>
                  <td className="px-6 py-3 text-ink/60">{fmtDate(r.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
