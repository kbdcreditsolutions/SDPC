"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/Card";

type Appointment = {
  id: string;
  datetime: string;
  durationMin: number;
  status: string;
  notes: string | null;
  patient: { id: string; name: string };
  doctor: { id: string; name: string; specialty: string | null };
};

const fmtDay = (d: Date) =>
  d.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long" });

export default function AppointmentsClient({ initialAppointments }: { initialAppointments: Appointment[] }) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: "", doctorId: "", datetime: "", durationMin: "45", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/appointments/");
    const data = await res.json();
    setAppointments(data.appointments);
  }, []);

  useEffect(() => {
    fetch("/api/patients/")
      .then((r) => r.json())
      .then((d) => setPatients(d.patients));
    fetch("/api/doctors/")
      .then((r) => r.json())
      .then((d) => setDoctors(d.doctors));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/appointments/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create appointment");
        return;
      }
      
      setForm({ patientId: "", doctorId: "", datetime: "", durationMin: "45", notes: "" });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  const groups = new Map<string, Appointment[]>();
  for (const a of appointments ?? []) {
    const key = new Date(a.datetime).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Appointments</h1>
          <p className="mt-1 text-sm text-ink/60">{appointments?.length ?? 0} scheduled sessions</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep"
        >
          + New Appointment
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
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
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
              <label className="text-xs text-ink/60">Doctor*</label>
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
              <label className="text-xs text-ink/60">Date &amp; Time*</label>
              <input
                required
                type="datetime-local"
                value={form.datetime}
                onChange={(e) => setForm({ ...form, datetime: e.target.value })}
                className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ink/60">Duration (min)</label>
              <select
                value={form.durationMin}
                onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm"
              >
                {[30, 45, 60, 90].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-full">
              <label className="text-xs text-ink/60">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-full flex gap-3">
              <button
                disabled={saving}
                className="rounded-lg bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-60"
              >
                {saving ? "Creating…" : "Create"}
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
            {items.map((a) => (
              <Card key={a.id} className="w-72">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-ink/50">
                      {new Date(a.datetime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="mt-1 font-medium">{a.patient.name}</p>
                    <p className="text-xs text-ink/50">
                      {a.doctor.name} · {a.doctor.specialty ?? "—"}
                    </p>
                  </div>
                  <span className="rounded-full bg-sand px-2 py-0.5 text-xs">
                    {a.status.toLowerCase()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
      {appointments?.length === 0 && <p className="text-sm text-ink/40">No appointments yet.</p>}
    </div>
  );
}
