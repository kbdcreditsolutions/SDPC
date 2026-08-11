"use client";

import { useState } from "react";
import Link from "next/link";

type PatientSummary = {
  id: string;
  name: string;
  phone: string;
  pid: string | null;
  age: number | null;
  gender: string | null;
  createdAt: string;
  _count: { packages: number; invoices: number; packageSessions: number };
};

type Group = {
  canonical: PatientSummary;
  duplicates: PatientSummary[];
};

export default function DuplicatesClient({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [merging, setMerging] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [merged, setMerged] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<{ canonical: PatientSummary; duplicates: PatientSummary[] } | null>(null);

  async function mergeGroup(canonical: PatientSummary, duplicates: PatientSummary[]) {
    setConfirm(null);
    setMerging(canonical.id);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${canonical.id}/merge/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicateIds: duplicates.map((d) => d.id), dryRun: false }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Merge failed.");
        return;
      }
      setMerged((prev) => [...prev, canonical.id]);
      setGroups((prev) => prev.filter((g) => g.canonical.id !== canonical.id));
    } catch {
      setError("Merge failed — check your connection.");
    } finally {
      setMerging(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-display text-xl">Merge duplicates?</h2>
            <p className="mt-2 text-sm text-ink/70">
              This will move all packages, invoices, sessions, appointments, and clinical notes from{" "}
              <strong>{confirm.duplicates.map((d) => d.pid ?? d.name).join(", ")}</strong> into{" "}
              <strong>{confirm.canonical.pid ?? confirm.canonical.name}</strong>, then permanently remove the
              duplicate records. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => mergeGroup(confirm.canonical, confirm.duplicates)}
                className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay/80"
              >
                Yes, merge
              </button>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="rounded-lg px-4 py-2 text-sm text-ink/60 hover:bg-sand/60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div>
        <h1 className="font-display text-3xl">Duplicate Patients</h1>
        <p className="mt-1 text-sm text-ink/60">
          Grouped by phone + first name. Merging moves all packages, invoices, and sessions to the
          canonical record (lowest patient ID) then soft-deletes the duplicates.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div>
      )}

      {merged.length > 0 && (
        <div className="rounded-xl border border-forest/30 bg-forest/10 px-4 py-3 text-sm text-forest">
          {merged.length} group{merged.length > 1 ? "s" : ""} merged successfully.
        </div>
      )}

      {groups.length === 0 && merged.length === 0 && (
        <p className="text-sm text-ink/60">No duplicates found — all patient records look clean.</p>
      )}

      {groups.length === 0 && merged.length > 0 && (
        <p className="text-sm text-ink/60">All duplicate groups have been merged.</p>
      )}

      {groups.map((g) => (
        <div key={g.canonical.id} className="rounded-xl border border-sand bg-white p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
                {g.duplicates.length + 1} records · {g.canonical.phone}
              </p>
              <p className="mt-0.5 font-medium">{g.canonical.name}</p>
            </div>
            <button
              type="button"
              disabled={merging === g.canonical.id}
              onClick={() => setConfirm({ canonical: g.canonical, duplicates: g.duplicates })}
              className="rounded-lg bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-50"
            >
              {merging === g.canonical.id ? "Merging…" : `Merge ${g.duplicates.length} duplicate${g.duplicates.length > 1 ? "s" : ""} into canonical`}
            </button>
          </div>

          <div className="divide-y divide-sand/60">
            {[g.canonical, ...g.duplicates].map((p, i) => (
              <div key={p.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2.5 text-sm">
                <span
                  className={`w-20 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium ${
                    i === 0
                      ? "bg-forest/10 text-forest"
                      : "bg-clay/10 text-clay"
                  }`}
                >
                  {i === 0 ? "keep" : "merge"}
                </span>
                <Link href={`/admin/patients/${p.id}`} className="font-medium hover:text-forest">
                  {p.name}
                </Link>
                <span className="text-ink/55">{p.pid ?? "no PID"}</span>
                <span className="text-ink/55">
                  {p._count.packages} pkg · {p._count.packageSessions} sessions · {p._count.invoices} inv
                </span>
                <span className="text-ink/40 text-xs">
                  registered {new Date(p.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="pt-2">
        <Link href="/admin/patients/" className="text-sm text-forest underline">
          ← Back to patients
        </Link>
      </div>
    </div>
  );
}
