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

const localDateTimeInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyForm = { patientId: "", doctorId: "", datetime: "", durationMin: "45", notes: "" };

export default function AppointmentsClient({ initialAppointments }: { initialAppointments: Appointment[] }) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; patientName: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);

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

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(a: Appointment) {
    setForm({
      patientId: a.patient.id,
      doctorId: a.doctor.id,
      datetime: localDateTimeInput(a.datetime),
      durationMin: String(a.durationMin),
      notes: a.notes ?? "",
    });
    setEditingId(a.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        editingId ? `/api/appointments/${editingId}/` : "/api/appointments/",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || `Failed to ${editingId ? "update" : "create"} appointment`);
        return;
      }

      closeForm();
      load();
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${cancelTarget.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to cancel appointment");
        return;
      }
      setCancelTarget(null);
      load();
    } finally {
      setCancelling(false);
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
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
          className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep"
        >
          + New Appointment
        </button>
      </div>

      {showForm && (
        <Card>
          <p className="font-data text-[10px] uppercase tracking-widest text-ink/65">
            {editingId ? "Edit appointment" : "New appointment"}
          </p>
          <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                {saving ? "Saving…" : editingId ? "Save changes" : "Create"}
              </button>
              <button
                type="button"
                onClick={closeForm}
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
                    <p className="text-xs text-ink/70">
                      {new Date(a.datetime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="mt-1 font-medium">{a.patient.name}</p>
                    <p className="text-xs text-ink/70">
                      {a.doctor.name} · {a.doctor.specialty ?? "—"}
                    </p>
                    {a.notes && <p className="mt-1 text-xs text-ink/60">{a.notes}</p>}
                  </div>
                  <span className="rounded-full bg-sand px-2 py-0.5 text-xs">
                    {a.status.toLowerCase()}
                  </span>
                </div>
                {a.status === "SCHEDULED" && (
                  <div className="mt-3 flex gap-3 border-t border-sand/60 pt-3 text-xs font-medium">
                    <button onClick={() => startEdit(a)} className="text-ink/70 hover:text-ink">
                      Edit
                    </button>
                    <button
                      onClick={() => setCancelTarget({ id: a.id, patientName: a.patient.name })}
                      className="text-clay/70 hover:text-clay"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
      {appointments?.length === 0 && <p className="text-sm text-ink/65">No appointments yet.</p>}

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <Card className="w-full max-w-sm">
            <h2 className="font-display text-lg">Cancel appointment?</h2>
            <p className="mt-2 text-sm text-ink/70">
              This marks <span className="font-medium text-ink">{cancelTarget.patientName}</span>&apos;s
              appointment as cancelled. It stays in the list for record-keeping.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="rounded-lg px-4 py-2 text-sm text-ink/60 hover:bg-sand/60 disabled:opacity-60"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                disabled={cancelling}
                className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-cream hover:bg-clay/90 disabled:opacity-60"
              >
                {cancelling ? "Cancelling…" : "Cancel appointment"}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
