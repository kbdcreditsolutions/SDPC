"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";

type PackageSession = {
  id: string;
  date: string;
  notes: string | null;
  patient: { id: string; name: string };
  doctor: { id: string; name: string; specialty: string | null };
  package: { id: string; name: string; totalSessions: number; usedSessions: number };
};

type PatientOption = { id: string; name: string };
type DoctorOption = { id: string; name: string };
type PackageOption = {
  id: string;
  name: string;
  totalSessions: number;
  usedSessions: number;
  status: string;
};

const fmtDay = (d: Date) =>
  d.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long" });

export default function SessionsClient({ initialSessions }: { initialSessions: PackageSession[] }) {
  const [sessions, setSessions] = useState<PackageSession[]>(initialSessions);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [patientPackages, setPatientPackages] = useState<PackageOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: "", packageId: "", doctorId: "", date: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/sessions/");
    const data = await res.json();
    setSessions(data.sessions);
  }, []);

  useEffect(() => {
    fetch("/api/patients/")
      .then((r) => r.json())
      .then((d) => setPatients(d.patients));
    fetch("/api/doctors/")
      .then((r) => r.json())
      .then((d) => setDoctors(d.doctors));
  }, []);

  useEffect(() => {
    if (!form.patientId) {
      setPatientPackages([]);
      return;
    }
    fetch(`/api/patients/${form.patientId}/packages/`)
      .then((r) => r.json())
      .then((d) => setPatientPackages(d.packages ?? []));
  }, [form.patientId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/sessions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to log session");
        return;
      }

      setForm({ patientId: "", packageId: "", doctorId: "", date: "", notes: "" });
      setPatientPackages([]);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleUndo(id: string) {
    if (!confirm("Undo this session? It will be removed and the package session count restored.")) return;
    try {
      const res = await fetch(`/api/sessions/${id}/`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to undo session");
        return;
      }
      load();
    } catch {
      alert("Failed to undo session");
    }
  }

  const groups = new Map<string, PackageSession[]>();
  for (const s of sessions ?? []) {
    const key = new Date(s.date).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Sessions</h1>
          <p className="mt-1 text-sm text-ink/60">{sessions?.length ?? 0} sessions logged</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep"
        >
          + Log Session
        </button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-ink/60">Patient*</label>
              <select
                required
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value, packageId: "" })}
                className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm"
              >
                <option value="">— select —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink/60">Package*</label>
              <select
                required
                disabled={!form.patientId}
                value={form.packageId}
                onChange={(e) => setForm({ ...form, packageId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">— select —</option>
                {patientPackages.map((pkg) => (
                  <option
                    key={pkg.id}
                    value={pkg.id}
                    disabled={pkg.status !== "ACTIVE" || pkg.usedSessions >= pkg.totalSessions}
                  >
                    {pkg.name} ({pkg.usedSessions}/{pkg.totalSessions}
                    {pkg.status !== "ACTIVE" ? ` · ${pkg.status.toLowerCase()}` : ""})
                  </option>
                ))}
              </select>
              {form.patientId && patientPackages.length === 0 && (
                <p className="mt-1 text-xs text-clay">No packages for this patient yet.</p>
              )}
            </div>
            <div>
              <label className="text-xs text-ink/60">Therapist*</label>
              <select
                required
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm"
              >
                <option value="">— select —</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink/60">Date &amp; Time</label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-full">
              <label className="text-xs text-ink/60">Session notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm min-h-[70px]"
                placeholder="What was covered in this session…"
              />
            </div>
            <div className="col-span-full flex gap-3">
              <button
                disabled={saving}
                className="rounded-lg bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-60"
              >
                {saving ? "Saving…" : "Mark session done"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-5 py-2 text-sm text-ink/60 hover:bg-sand/60"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {[...groups.entries()].map(([day, items]) => (
        <div key={day}>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            {fmtDay(new Date(day))}
            <span className="rounded-full bg-sand px-2 py-0.5 text-xs">{items.length}</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {items.map((s) => (
              <Card key={s.id} className="w-80">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-ink/70">
                      {new Date(s.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <Link href={`/admin/patients/${s.patient.id}`} className="mt-1 font-medium hover:text-forest">
                      {s.patient.name}
                    </Link>
                    <p className="text-xs text-ink/70">
                      {s.doctor.name} · {s.doctor.specialty ?? "—"}
                    </p>
                  </div>
                  <button onClick={() => handleUndo(s.id)} className="text-xs text-clay/70 hover:text-clay">
                    Undo
                  </button>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-ink/70">
                    <span>{s.package.name}</span>
                    <span>
                      {s.package.usedSessions}/{s.package.totalSessions}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand">
                    <div
                      className="h-full bg-forest"
                      style={{
                        width: `${Math.min(100, (s.package.usedSessions / s.package.totalSessions) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                {s.notes && <p className="mt-3 text-xs text-ink/70">{s.notes}</p>}
              </Card>
            ))}
          </div>
        </div>
      ))}
      {sessions?.length === 0 && <p className="text-sm text-ink/65">No sessions logged yet.</p>}
    </div>
  );
}
