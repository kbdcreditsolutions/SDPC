"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { DateTimePicker } from "@/components/DateTimePicker";

type PackageSession = {
  id: string;
  date: string;
  notes: string | null;
  patient: { id: string; name: string };
  doctor: { id: string; name: string; specialty: string | null };
  package: { id: string; name: string; totalSessions: number; usedSessions: number };
};

type PatientOption = { id: string; name: string; phone: string };
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
  const [patientQuery, setPatientQuery] = useState("");
  const [patientOpen, setPatientOpen] = useState(false);
  const patientBoxRef = useRef<HTMLDivElement>(null);
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [pkgForm, setPkgForm] = useState({ name: "10 Session Package", totalSessions: "10", price: "8000", paymentMode: "Cash" });
  const [savingPkg, setSavingPkg] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/sessions/");
    const data = await res.json();
    setSessions(data.sessions);
  }, []);

  const loadPatientPackages = useCallback(async (patientId: string) => {
    const res = await fetch(`/api/patients/${patientId}/packages/`);
    const data = await res.json();
    setPatientPackages(data.packages ?? []);
    return data.packages ?? [];
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
    loadPatientPackages(form.patientId);
  }, [form.patientId, loadPatientPackages]);

  useEffect(() => {
    if (!patientOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (patientBoxRef.current && !patientBoxRef.current.contains(e.target as Node)) {
        setPatientOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [patientOpen]);

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
      setPatientQuery("");
      setPatientPackages([]);
      setShowPkgForm(false);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function addPackageInline() {
    if (!form.patientId) return;
    setSavingPkg(true);
    try {
      const res = await fetch(`/api/patients/${form.patientId}/packages/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pkgForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to add package");
        return;
      }
      const created = await res.json();
      await loadPatientPackages(form.patientId);
      setForm((f) => ({ ...f, packageId: created.package?.id ?? f.packageId }));
      setPkgForm({ name: "10 Session Package", totalSessions: "10", price: "8000", paymentMode: "Cash" });
      setShowPkgForm(false);
    } catch {
      alert("Failed to add package — check your connection and try again.");
    } finally {
      setSavingPkg(false);
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
            <div className="relative" ref={patientBoxRef}>
              <label className="text-xs text-ink/60">Patient*</label>
              {form.patientId ? (
                <div className="mt-1 flex items-center justify-between rounded-lg border border-sand bg-sand/20 px-3 py-2 text-sm">
                  <span>{patients.find((p) => p.id === form.patientId)?.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, patientId: "", packageId: "" });
                      setPatientQuery("");
                      setShowPkgForm(false);
                    }}
                    className="text-xs text-ink/50 hover:text-clay"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <input
                  required
                  placeholder="Search by name or phone…"
                  value={patientQuery}
                  onChange={(e) => {
                    setPatientQuery(e.target.value);
                    setPatientOpen(true);
                  }}
                  onFocus={() => setPatientOpen(true)}
                  className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm"
                />
              )}
              {patientOpen && !form.patientId && patientQuery.trim().length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-sand bg-white shadow-lg">
                  {patients
                    .filter((p) => {
                      const q = patientQuery.trim().toLowerCase();
                      return p.name.toLowerCase().includes(q) || p.phone?.includes(q);
                    })
                    .slice(0, 20)
                    .map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setForm({ ...form, patientId: p.id, packageId: "" });
                            setPatientQuery("");
                            setPatientOpen(false);
                            setShowPkgForm(false);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-sand/40"
                        >
                          {p.name} <span className="text-ink/60">{p.phone}</span>
                        </button>
                      </li>
                    ))}
                  {patients.filter((p) => {
                    const q = patientQuery.trim().toLowerCase();
                    return p.name.toLowerCase().includes(q) || p.phone?.includes(q);
                  }).length === 0 && <li className="px-3 py-2 text-sm text-ink/50">No matches</li>}
                </ul>
              )}
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
              {form.patientId && patientPackages.length === 0 && !showPkgForm && (
                <p className="mt-1 text-xs text-clay">
                  No packages for this patient yet.{" "}
                  <button
                    type="button"
                    onClick={() => setShowPkgForm(true)}
                    className="font-medium text-forest hover:underline"
                  >
                    + New package
                  </button>
                </p>
              )}
              {form.patientId && showPkgForm && (
                <div className="mt-2 rounded-lg border border-sand bg-sand/20 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-ink/60">New package</p>
                  <p className="mt-1 text-xs text-ink/60">Full amount is invoiced and marked paid immediately.</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      required
                      placeholder="Package name"
                      value={pkgForm.name}
                      onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                      className="col-span-2 rounded-lg border border-sand px-2 py-1.5 text-sm"
                    />
                    <input
                      required
                      type="number"
                      placeholder="Sessions"
                      value={pkgForm.totalSessions}
                      onChange={(e) => setPkgForm({ ...pkgForm, totalSessions: e.target.value })}
                      className="rounded-lg border border-sand px-2 py-1.5 text-sm"
                    />
                    <input
                      required
                      type="number"
                      placeholder="Price"
                      value={pkgForm.price}
                      onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })}
                      className="rounded-lg border border-sand px-2 py-1.5 text-sm"
                    />
                    <select
                      required
                      value={pkgForm.paymentMode}
                      onChange={(e) => setPkgForm({ ...pkgForm, paymentMode: e.target.value })}
                      className="rounded-lg border border-sand px-2 py-1.5 text-sm"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Netbanking">Netbanking</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={savingPkg}
                        onClick={addPackageInline}
                        className="flex-1 rounded-lg bg-forest px-3 py-1.5 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-60"
                      >
                        {savingPkg ? "Adding…" : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPkgForm(false)}
                        className="rounded-lg px-3 py-1.5 text-sm text-ink/60 hover:bg-sand/60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
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
              <div className="mt-1">
                <DateTimePicker value={form.date} onChange={(date) => setForm({ ...form, date })} />
              </div>
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
