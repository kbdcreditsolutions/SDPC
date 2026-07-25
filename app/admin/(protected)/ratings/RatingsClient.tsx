"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/Card";

const PATIENT_DIM_LABELS: Record<string, string> = {
  punctuality: "Punctuality",
  attentionToDetail: "Attention to Detail",
  understanding: "Understanding",
  communication: "Communication",
  overallExperience: "Overall Experience",
};
const DEPT_DIM_LABELS: Record<string, string> = {
  clinicalSkills: "Clinical Skills",
  documentation: "Documentation",
  knowledge: "Knowledge",
  caseManagement: "Case Management",
};

function emptyScores(labels: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.keys(labels).map((k) => [k, "3"]));
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-ink/60">{label}</span>
        <span className="font-data">{value}/5</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full" style={{ width: `${(value / 5) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function AddRatingForm({
  doctorId,
  type,
  labels,
  onDone,
  onCancel,
}: {
  doctorId: string;
  type: "PATIENT" | "DEPT_HEAD";
  labels: Record<string, string>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [scores, setScores] = useState<Record<string, string>>(() => emptyScores(labels));
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/ratings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          type,
          scores: Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Number(v)])),
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to save rating");
        return;
      }
      onDone();
    } catch {
      alert("Failed to save rating — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border-t border-sand/60 pt-4">
      {Object.entries(labels).map(([key, label]) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <label className="text-xs text-ink/70">{label}</label>
          <select
            value={scores[key]}
            onChange={(e) => setScores((s) => ({ ...s, [key]: e.target.value }))}
            className="rounded-lg border border-sand px-2 py-1 text-sm"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      ))}
      <textarea
        placeholder="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-sand px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-forest px-4 py-1.5 text-xs font-medium text-cream hover:bg-forest-deep disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save rating"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg px-4 py-1.5 text-xs text-ink/60 hover:bg-sand/60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function RatingsClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState<any>(initialData);
  const [selected, setSelected] = useState<string | null>(initialData.doctors[0]?.id || null);
  const [addingType, setAddingType] = useState<"PATIENT" | "DEPT_HEAD" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDetail = useCallback(async (doctorId: string) => {
    const res = await fetch(`/api/ratings/?doctorId=${doctorId}`);
    const detail = await res.json();
    setData((prev: any) => ({ ...prev, detail }));
  }, []);

  useEffect(() => {
    if (selected) loadDetail(selected);
  }, [selected, loadDetail]);

  async function confirmDelete() {
    if (!deleteTarget || !selected) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/ratings/${deleteTarget}/`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to delete rating");
        return;
      }
      setDeleteTarget(null);
      loadDetail(selected);
    } catch {
      alert("Failed to delete rating");
    } finally {
      setDeleting(false);
    }
  }

  const currentDoctor = data.doctors.find((d: any) => d.id === selected);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Doctor Performance &amp; Ratings</h1>
        <p className="mt-1 text-sm text-ink/60">Patient feedback + Department Head reviews</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit p-2">
          <p className="px-3 py-2 font-data text-[10px] uppercase tracking-widest text-ink/65">
            Doctors
          </p>
          {data.doctors.map((d: any) => (
            <button
              key={d.id}
              onClick={() => {
                setSelected(d.id);
                setAddingType(null);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                selected === d.id ? "bg-forest text-cream" : "hover:bg-sand/60"
              }`}
            >
              <div className="font-medium">{d.name}</div>
              <div className={`text-xs ${selected === d.id ? "text-cream/70" : "text-ink/70"}`}>
                {d.specialty ?? "—"}
              </div>
            </button>
          ))}
        </Card>

        {data.detail && currentDoctor && (
          <div className="space-y-6">
            <div>
              <p className="font-data text-[10px] uppercase tracking-widest text-ink/65">Now viewing</p>
              <p className="font-display text-xl">{currentDoctor.name}</p>
              <p className="text-sm text-ink/70">{currentDoctor.specialty}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Patient Feedback ({data.detail.patientCount})</p>
                  {addingType !== "PATIENT" && (
                    <button
                      onClick={() => setAddingType("PATIENT")}
                      className="text-xs font-medium text-forest hover:text-forest-deep"
                    >
                      + Add rating
                    </button>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {Object.entries(PATIENT_DIM_LABELS).map(([key, label]) => (
                    <Bar key={key} label={label} value={data.detail.patientAvg[key] ?? 0} color="var(--forest)" />
                  ))}
                </div>
                {addingType === "PATIENT" && selected && (
                  <AddRatingForm
                    doctorId={selected}
                    type="PATIENT"
                    labels={PATIENT_DIM_LABELS}
                    onCancel={() => setAddingType(null)}
                    onDone={() => {
                      setAddingType(null);
                      loadDetail(selected);
                    }}
                  />
                )}
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Dept Head Review ({data.detail.deptCount})</p>
                  {addingType !== "DEPT_HEAD" && (
                    <button
                      onClick={() => setAddingType("DEPT_HEAD")}
                      className="text-xs font-medium text-forest hover:text-forest-deep"
                    >
                      + Add rating
                    </button>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {Object.entries(DEPT_DIM_LABELS).map(([key, label]) => (
                    <Bar key={key} label={label} value={data.detail.deptAvg[key] ?? 0} color="var(--clay)" />
                  ))}
                </div>
                {addingType === "DEPT_HEAD" && selected && (
                  <AddRatingForm
                    doctorId={selected}
                    type="DEPT_HEAD"
                    labels={DEPT_DIM_LABELS}
                    onCancel={() => setAddingType(null)}
                    onDone={() => {
                      setAddingType(null);
                      loadDetail(selected);
                    }}
                  />
                )}
              </Card>
            </div>

            <Card>
              <p className="text-sm font-medium">Recent Feedback</p>
              <div className="mt-4 space-y-4">
                {data.detail.recent.map((r: any) => (
                  <div key={r.id} className="border-b border-sand/60 pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          r.type === "PATIENT" ? "bg-forest/10 text-forest" : "bg-clay-light text-clay"
                        }`}
                      >
                        {r.type === "PATIENT" ? "Patient" : "Dept Head"}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-ink/65">{fmtDate(r.date)}</span>
                        <button
                          onClick={() => setDeleteTarget(r.id)}
                          className="text-xs text-clay/70 hover:text-clay"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60">
                      {Object.entries(r.scores).map(([k, v]) => (
                        <span key={k}>
                          {(PATIENT_DIM_LABELS[k] ?? DEPT_DIM_LABELS[k] ?? k).toLowerCase()}:{" "}
                          <span className="font-data text-ink">{String(v)}/5</span>
                        </span>
                      ))}
                    </p>
                    {r.comment && <p className="mt-1 text-sm italic text-ink/70">&quot;{r.comment}&quot;</p>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <Card className="w-full max-w-sm">
            <h2 className="font-display text-lg">Delete rating?</h2>
            <p className="mt-2 text-sm text-ink/70">This removes it from the averages and recent feedback.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg px-4 py-2 text-sm text-ink/60 hover:bg-sand/60 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-cream hover:bg-clay/90 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete rating"}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
