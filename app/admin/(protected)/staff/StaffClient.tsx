"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/Card";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  specialty: string | null;
  isActive: boolean;
};

const GROUPS: { role: string; label: string }[] = [
  { role: "CLINIC_ADMIN", label: "Clinic Admins" },
  { role: "DOCTOR", label: "Doctors" },
  { role: "STAFF", label: "Staffs" },
];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function StaffClient({ initialUsers }: { initialUsers: StaffUser[] }) {
  const [users, setUsers] = useState<StaffUser[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF", specialty: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/");
    const data = await res.json();
    setUsers(data.users);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/staff/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to add staff member");
        return;
      }
      
      setForm({ name: "", email: "", password: "", role: "STAFF", specialty: "" });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/staff/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update staff status");
      }
    } finally {
      load();
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Staff &amp; Doctors</h1>
          <p className="mt-1 text-sm text-ink/60">{users?.length ?? 0} team members</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep"
        >
          + Add Team Member
        </button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-sand px-3 py-2 text-sm"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-sand px-3 py-2 text-sm"
            />
            <input
              required
              type="password"
              placeholder="Temp password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="rounded-lg border border-sand px-3 py-2 text-sm"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="rounded-lg border border-sand px-3 py-2 text-sm"
            >
              <option value="STAFF">Staff</option>
              <option value="DOCTOR">Doctor</option>
              <option value="CLINIC_ADMIN">Clinic Admin</option>
            </select>
            {form.role === "DOCTOR" && (
              <input
                placeholder="Specialty"
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                className="rounded-lg border border-sand px-3 py-2 text-sm"
              />
            )}
            <div className="col-span-full flex gap-3">
              <button
                disabled={saving}
                className="rounded-lg bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save member"}
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

      {GROUPS.map((g) => {
        const members = users?.filter((u) => u.role === g.role) ?? [];
        if (members.length === 0) return null;
        return (
          <div key={g.role}>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              {g.label}
              <span className="rounded-full bg-sand px-2 py-0.5 text-xs">{members.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((u) => (
                <Card key={u.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-light font-data text-sm font-semibold text-clay">
                        {initials(u.name)}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-ink/50">{u.email}</p>
                        {u.specialty && <p className="text-xs text-ink/50">{u.specialty}</p>}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        u.isActive ? "bg-forest/10 text-forest" : "bg-sand text-ink/50"
                      }`}
                    >
                      {u.isActive ? "active" : "inactive"}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleActive(u.id, u.isActive)}
                    className="mt-3 text-xs text-ink/50 hover:text-ink"
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
                  </button>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
