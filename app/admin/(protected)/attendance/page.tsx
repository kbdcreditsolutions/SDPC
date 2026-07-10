"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/Card";

type Row = { id: string; name: string; role?: string; status: string };

export default function AttendancePage() {
  const [tab, setTab] = useState<"staff" | "patients">("staff");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [staff, setStaff] = useState<Row[]>([]);
  const [patients, setPatients] = useState<Row[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/attendance/?date=${date}`);
    const data = await res.json();
    setStaff(data.staff);
    setPatients(data.patients);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function mark(subject: "STAFF" | "PATIENT", id: string, status: string) {
    const res = await fetch("/api/attendance/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        subject === "STAFF"
          ? { date, subject, userId: id, status }
          : { date, subject, patientId: id, status }
      ),
    });
    
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to mark attendance");
      return;
    }
    
    load();
  }

  const rows = tab === "staff" ? staff : patients;
  const actions = tab === "staff" ? ["PRESENT", "LEAVE", "ABSENT"] : ["PRESENT", "LATE", "ABSENT"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Attendance</h1>
          <p className="mt-1 text-sm text-ink/60">Mark daily attendance</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-sand px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-6 border-b border-sand text-sm">
        {(["staff", "patients"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-3 capitalize ${
              tab === t ? "border-forest text-forest" : "border-transparent text-ink/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand text-left text-[10px] uppercase tracking-widest text-ink/40">
              <th className="px-6 py-3">{tab === "staff" ? "Team member" : "Patient"}</th>
              {tab === "staff" && <th className="px-6 py-3">Role</th>}
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-sand/60 last:border-0">
                <td className="px-6 py-3">{r.name}</td>
                {tab === "staff" && <td className="px-6 py-3 text-ink/60">{r.role}</td>}
                <td className="px-6 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      r.status === "PRESENT"
                        ? "bg-forest/10 text-forest"
                        : r.status === "UNMARKED"
                        ? "bg-sand text-ink/50"
                        : "bg-clay-light text-clay"
                    }`}
                  >
                    {r.status.toLowerCase()}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex gap-3 text-xs">
                    {actions.map((a) => (
                      <button
                        key={a}
                        onClick={() => mark(tab === "staff" ? "STAFF" : "PATIENT", r.id, a)}
                        className="text-ink/60 hover:text-forest"
                      >
                        {a[0] + a.slice(1).toLowerCase()}
                      </button>
                    ))}
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
