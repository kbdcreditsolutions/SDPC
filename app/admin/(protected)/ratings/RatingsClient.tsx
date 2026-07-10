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

export default function RatingsClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState<any>(initialData);
  const [selected, setSelected] = useState<string | null>(initialData.doctors[0]?.id || null);

  const loadDetail = useCallback(async (doctorId: string) => {
    const res = await fetch(`/api/ratings/?doctorId=${doctorId}`);
    const detail = await res.json();
    setData((prev: any) => ({ ...prev, detail }));
  }, []);

  useEffect(() => {
    if (selected) loadDetail(selected);
  }, [selected, loadDetail]);

  const currentDoctor = data.doctors.find((d: any) => d.id === selected);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Doctor Performance &amp; Ratings</h1>
        <p className="mt-1 text-sm text-ink/60">Patient feedback + Department Head reviews</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit p-2">
          <p className="px-3 py-2 font-data text-[10px] uppercase tracking-widest text-ink/40">
            Doctors
          </p>
          {data.doctors.map((d: any) => (
            <button
              key={d.id}
              onClick={() => setSelected(d.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                selected === d.id ? "bg-forest text-cream" : "hover:bg-sand/60"
              }`}
            >
              <div className="font-medium">{d.name}</div>
              <div className={`text-xs ${selected === d.id ? "text-cream/70" : "text-ink/50"}`}>
                {d.specialty ?? "—"}
              </div>
            </button>
          ))}
        </Card>

        {data.detail && currentDoctor && (
          <div className="space-y-6">
            <div>
              <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">Now viewing</p>
              <p className="font-display text-xl">{currentDoctor.name}</p>
              <p className="text-sm text-ink/50">{currentDoctor.specialty}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <p className="text-sm font-medium">Patient Feedback ({data.detail.patientCount})</p>
                <div className="mt-4 space-y-3">
                  {Object.entries(PATIENT_DIM_LABELS).map(([key, label]) => (
                    <Bar key={key} label={label} value={data.detail.patientAvg[key] ?? 0} color="var(--forest)" />
                  ))}
                </div>
              </Card>
              <Card>
                <p className="text-sm font-medium">Dept Head Review ({data.detail.deptCount})</p>
                <div className="mt-4 space-y-3">
                  {Object.entries(DEPT_DIM_LABELS).map(([key, label]) => (
                    <Bar key={key} label={label} value={data.detail.deptAvg[key] ?? 0} color="var(--clay)" />
                  ))}
                </div>
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
                      <span className="text-xs text-ink/40">{fmtDate(r.date)}</span>
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
    </div>
  );
}
