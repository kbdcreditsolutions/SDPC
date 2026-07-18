"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";

type Patient = {
  id: string;
  name: string;
  phone: string;
  age: number | null;
  gender: string | null;
  address: string | null;
  referralDoctor: string | null;
  createdAt: string;
  reason: string | null;
  leadSource: string | null;
  billed: number;
  outstanding: number;
};

const LEAD_LABELS: Record<string, string> = {
  DIRECT: "Direct",
  REFERRAL: "Referral",
  GOOGLE: "Google",
  FACEBOOK: "Facebook",
  WALK_IN: "Walk-in",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const localDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => localDateInput(new Date());

export default function PatientsClient({ initialPatients }: { initialPatients: Patient[] }) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalCreatedAt, setOriginalCreatedAt] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "",
    reason: "",
    leadSource: "WALK_IN",
    referralDoctor: "",
    address: "",
    createdAt: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (query: string) => {
    const res = await fetch(`/api/patients/${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json();
    setPatients(data.patients);
  }, []);

  // Removed initial load in useEffect since we have initial data from server

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/patients/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to add patient");
        return;
      }
      
      setForm({ name: "", phone: "", age: "", gender: "", reason: "", leadSource: "WALK_IN", referralDoctor: "", address: "", createdAt: "" });
      setShowForm(false);
      load(q);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this patient?")) return;
    try {
      const res = await fetch(`/api/patients/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      load(q);
    } catch {
      alert("Failed to delete patient");
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        // Only send createdAt if the staff member actually changed it —
        // otherwise every edit would truncate the real timestamp to UTC midnight.
        createdAt: form.createdAt === originalCreatedAt ? undefined : form.createdAt,
      };
      const res = await fetch(`/api/patients/${editingId}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setEditingId(null);
      setForm({ name: "", phone: "", age: "", gender: "", reason: "", leadSource: "WALK_IN", referralDoctor: "", address: "", createdAt: "" });
      setShowForm(false);
      load(q);
    } catch {
      alert("Failed to update patient");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Patients</h1>
          <p className="mt-1 text-sm text-ink/60">{patients?.length ?? 0} records</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ name: "", phone: "", age: "", gender: "", reason: "", leadSource: "WALK_IN", referralDoctor: "", address: "", createdAt: "" });
            setShowForm((s) => !s);
          }}
          className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep"
        >
          + Add Patient
        </button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={editingId ? handleEdit : handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-sand px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-lg border border-sand px-3 py-2 text-sm"
            />
            <input
              required={!editingId}
              type="number"
              min={0}
              max={150}
              placeholder="Age"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="rounded-lg border border-sand px-3 py-2 text-sm"
            />
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="rounded-lg border border-sand px-3 py-2 text-sm"
            >
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              placeholder="Reason for consultation"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="rounded-lg border border-sand px-3 py-2 text-sm"
            />
            <select
              value={form.leadSource}
              onChange={(e) => setForm({ ...form, leadSource: e.target.value })}
              className="rounded-lg border border-sand px-3 py-2 text-sm"
            >
              {Object.entries(LEAD_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              placeholder="Referral doctor (optional)"
              value={form.referralDoctor}
              onChange={(e) => setForm({ ...form, referralDoctor: e.target.value })}
              className="rounded-lg border border-sand px-3 py-2 text-sm"
            />
            <input
              placeholder="Address (optional)"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="rounded-lg border border-sand px-3 py-2 text-sm sm:col-span-2 lg:col-span-3"
            />
            <label className="flex flex-col gap-1 text-xs text-ink/50">
              Joined date
              <input
                type="date"
                max={today()}
                value={form.createdAt || today()}
                onChange={(e) => setForm({ ...form, createdAt: e.target.value })}
                className="rounded-lg border border-sand px-3 py-2 text-sm text-ink"
              />
            </label>
            <div className="col-span-full flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-60"
              >
                {saving ? "Saving…" : editingId ? "Update patient" : "Save patient"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="rounded-lg px-5 py-2 text-sm text-ink/60 hover:bg-sand/60"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <input
        placeholder="Search by name, phone, email…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          load(e.target.value);
        }}
        className="w-full max-w-md rounded-lg border border-sand bg-white px-4 py-2.5 text-sm outline-none focus:border-forest"
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand text-left text-[10px] uppercase tracking-widest text-ink/40">
              <th className="px-6 py-3">Patient</th>
              <th className="px-6 py-3">Age/Gender</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3">Reason</th>
              <th className="px-6 py-3">Lead</th>
              <th className="px-6 py-3">Billed</th>
              <th className="px-6 py-3">Outstanding</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {patients?.map((p) => (
              <tr key={p.id} className="border-b border-sand/60 last:border-0 hover:bg-sand/20">
                <td className="px-6 py-3">
                  <Link href={`/admin/patients/${p.id}`} className="font-medium hover:text-forest">
                    {p.name}
                  </Link>
                  <div className="text-xs text-ink/50">{p.phone}</div>
                </td>
                <td className="px-6 py-3 text-ink/70">
                  {p.age ?? "—"}{p.gender ? ` · ${p.gender}` : ""}
                </td>
                <td className="px-6 py-3 text-ink/70">
                  {new Date(p.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-3 text-ink/70">{p.reason ?? "—"}</td>
                <td className="px-6 py-3 text-ink/70">
                  {p.leadSource ? LEAD_LABELS[p.leadSource] : "—"}
                </td>
                <td className="px-6 py-3 font-data">{inr(p.billed)}</td>
                <td className="px-6 py-3 font-data">
                  {p.outstanding > 0 ? (
                    <span className="text-clay">{inr(p.outstanding)}</span>
                  ) : (
                    <span className="text-forest">Cleared</span>
                  )}
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-3 text-xs font-medium">
                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        const joinedDate = localDateInput(new Date(p.createdAt));
                        setOriginalCreatedAt(joinedDate);
                        setForm({
                          name: p.name,
                          phone: p.phone,
                          age: p.age?.toString() || "",
                          gender: p.gender || "",
                          reason: p.reason || "",
                          leadSource: p.leadSource || "WALK_IN",
                          referralDoctor: p.referralDoctor || "",
                          address: p.address || "",
                          createdAt: joinedDate,
                        });
                        setShowForm(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-ink/50 hover:text-ink"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-clay/70 hover:text-clay">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
