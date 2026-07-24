"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const LEAD_LABELS: Record<string, string> = {
  DIRECT: "Direct",
  REFERRAL: "Doctor Referral",
  GOOGLE: "Google",
  FACEBOOK: "Facebook",
  WALK_IN: "Walk-In",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  PATIENT_REFERRAL: "Friend/Family Referral",
  FLYERS: "Flyers",
  HOARDINGS: "Hoardings",
  TV_ADS: "TV Ads",
  CINEMA_ADS: "Cinema Theatre Ads",
  NEWSPAPER_AD: "Newspaper Ad",
};

type Tab = "overview" | "packages" | "notes" | "invoices" | "appointments";

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [patient, setPatient] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [pkgForm, setPkgForm] = useState({ name: "10 Session Package", totalSessions: "10", price: "8000", paymentMode: "Cash" });
  const [noteForm, setNoteForm] = useState("");
  const [noteAttachments, setNoteAttachments] = useState<File[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [sessionFormPkg, setSessionFormPkg] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState({ doctorId: "", date: "", notes: "" });
  const [loggingSession, setLoggingSession] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgEditForm, setPkgEditForm] = useState({ name: "", totalSessions: "", price: "" });
  const [savingPkgEdit, setSavingPkgEdit] = useState(false);
  const [deletePkgTarget, setDeletePkgTarget] = useState<{ id: string; name: string } | null>(null);
  const [deletingPkg, setDeletingPkg] = useState(false);
  const [confirmExtraPkg, setConfirmExtraPkg] = useState(false);
  const [savingPkg, setSavingPkg] = useState(false);

  useEffect(() => {
    fetch("/api/doctors/")
      .then((r) => r.json())
      .then((d) => setDoctors(d.doctors));
  }, []);

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const load = useCallback(async () => {
    const res = await fetch(`/api/patients/${id}`);
    const data = await res.json();
    setPatient(data.patient);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!patient) return <p className="text-sm text-ink/70">Loading…</p>;

  async function addPackage(e?: React.FormEvent) {
    e?.preventDefault();
    if (savingPkg) return;
    const hasActivePackage = patient.packages.some((p: any) => p.status === "ACTIVE");
    if (hasActivePackage && !confirmExtraPkg) {
      setConfirmExtraPkg(true);
      return;
    }
    setSavingPkg(true);
    try {
      const res = await fetch(`/api/patients/${id}/packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pkgForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to add package");
        return;
      }
      setPkgForm({ name: "", totalSessions: "", price: "", paymentMode: "Cash" });
      setConfirmExtraPkg(false);
      load();
    } catch {
      alert("Failed to add package — check your connection and try again.");
    } finally {
      setSavingPkg(false);
    }
  }

  async function packageAction(pkgId: string, action: string) {
    await fetch(`/api/patients/${id}/packages/${pkgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  function startEditPkg(pkg: any) {
    setEditingPkgId(pkg.id);
    setPkgEditForm({ name: pkg.name, totalSessions: String(pkg.totalSessions), price: String(pkg.price) });
  }

  async function savePkgEdit(e: React.FormEvent, pkgId: string) {
    e.preventDefault();
    setSavingPkgEdit(true);
    try {
      const res = await fetch(`/api/patients/${id}/packages/${pkgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", ...pkgEditForm }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to update package");
        return;
      }
      setEditingPkgId(null);
      load();
    } finally {
      setSavingPkgEdit(false);
    }
  }

  async function confirmDeletePkg() {
    if (!deletePkgTarget) return;
    setDeletingPkg(true);
    try {
      const res = await fetch(`/api/patients/${id}/packages/${deletePkgTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to delete package");
        return;
      }
      setDeletePkgTarget(null);
      load();
    } finally {
      setDeletingPkg(false);
    }
  }

  async function logSession(e: React.FormEvent, pkgId: string) {
    e.preventDefault();
    setLoggingSession(true);
    try {
      const res = await fetch(`/api/sessions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: id, packageId: pkgId, ...sessionForm }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to log session");
        return;
      }
      setSessionForm({ doctorId: "", date: "", notes: "" });
      setSessionFormPkg(null);
      load();
    } finally {
      setLoggingSession(false);
    }
  }

  async function undoSession(sessionId: string) {
    if (!confirm("Undo this session? It will be removed and the package session count restored.")) return;
    const res = await fetch(`/api/sessions/${sessionId}/`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Failed to undo session");
      return;
    }
    load();
  }

  async function handleDeleteInvoice(invId: string) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`/api/invoices/${invId}/`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      load();
    } catch {
      alert("Failed to delete invoice");
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteForm.trim() && noteAttachments.length === 0) return;
    
    const attachments = await Promise.all(
      noteAttachments.map(async (f) => ({
        name: f.name,
        type: f.type,
        data: await toBase64(f)
      }))
    );

    await fetch(`/api/patients/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteForm, attachments }),
    });
    setNoteForm("");
    setNoteAttachments([]);
    load();
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "packages", label: `Packages (${patient.packages.length})` },
    { key: "notes", label: `Clinical Notes (${patient.clinicalNotes.length})` },
    { key: "invoices", label: `Invoices (${patient.invoices.length})` },
    { key: "appointments", label: `Appointments (${patient.appointments.length})` },
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/patients" className="text-sm text-ink/70 hover:text-ink">
        ← All patients
      </Link>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-clay-light font-data text-lg font-semibold text-clay">
              {patient.name
                .split(" ")
                .map((p: string) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-xl">{patient.name}</p>
                {patient.pid && (
                  <span className="rounded-full bg-forest/10 px-2 py-0.5 font-data text-xs text-forest">
                    {patient.pid}
                  </span>
                )}
              </div>
              <p className="text-sm text-ink/70">
                {patient.phone} {patient.age ? `· ${patient.age}y` : ""} {patient.gender ? `· ${patient.gender}` : ""} · Joined{" "}
                {fmtDate(patient.createdAt)}
              </p>
              <div className="mt-2 flex gap-2">
                {patient.leadSource && (
                  <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs">
                    {LEAD_LABELS[patient.leadSource] ?? patient.leadSource}
                  </span>
                )}
                {patient.reason && (
                  <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs">{patient.reason}</span>
                )}
                {patient.referralDoctor && (
                  <span className="rounded-full bg-clay-light px-2.5 py-0.5 text-xs text-clay">
                    Ref: {patient.referralDoctor}
                  </span>
                )}
                {patient.referredByPatient && (
                  <Link
                    href={`/admin/patients/${patient.referredByPatient.id}`}
                    className="rounded-full bg-clay-light px-2.5 py-0.5 text-xs text-clay hover:underline"
                  >
                    Referred by: {patient.referredByPatient.name}
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="font-data text-[10px] uppercase tracking-widest text-ink/65">Billed</p>
              <p className="font-display text-lg">{inr(patient.billed)}</p>
            </div>
            <div>
              <p className="font-data text-[10px] uppercase tracking-widest text-ink/65">Paid</p>
              <p className="font-display text-lg text-forest">{inr(patient.paid)}</p>
            </div>
            <div>
              <p className="font-data text-[10px] uppercase tracking-widest text-ink/65">
                Outstanding
              </p>
              <p className="font-display text-lg text-clay">{inr(patient.outstanding)}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-6 border-b border-sand text-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 pb-3 ${
              tab === t.key ? "border-forest text-forest" : "border-transparent text-ink/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <p className="font-data text-[10px] uppercase tracking-widest text-ink/65">
              Patient information
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Patient ID", patient.pid ?? "—"],
                ["Full name", patient.name],
                ["Age", patient.age ?? "—"],
                ["Gender", patient.gender ?? "—"],
                ["Reason for consultation", patient.reason ?? "—"],
                ["Lead source", patient.leadSource ? LEAD_LABELS[patient.leadSource] ?? patient.leadSource : "—"],
                ["Referral doctor", patient.referralDoctor ?? "—"],
                [
                  "Referred by",
                  patient.referredByPatient ? (
                    <Link
                      key="referred-by-link"
                      href={`/admin/patients/${patient.referredByPatient.id}`}
                      className="text-forest hover:underline"
                    >
                      {patient.referredByPatient.name} ({patient.referredByPatient.phone})
                    </Link>
                  ) : (
                    "—"
                  ),
                ],
                ["Address", patient.address ?? "—"],
                ["Notes", patient.notes ?? "—"],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between border-b border-sand/60 pb-2">
                  <dt className="text-ink/70">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <p className="font-data text-[10px] uppercase tracking-widest text-ink/65">
              Recent activity
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {patient.appointments.slice(0, 5).map((a: any) => (
                <li key={a.id} className="flex items-center justify-between border-b border-sand/60 pb-2">
                  <div>
                    <div>Session with {a.doctor.name}</div>
                    <div className="text-xs text-ink/70">
                      {new Date(a.datetime).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <span className="rounded-full bg-sand px-2 py-0.5 text-xs">
                    {a.status.toLowerCase()}
                  </span>
                </li>
              ))}
              {patient.appointments.length === 0 && <p className="text-ink/65">No activity yet.</p>}
            </ul>
            {patient.referredPatients?.length > 0 && (
              <>
                <p className="mt-6 font-data text-[10px] uppercase tracking-widest text-ink/65">
                  Referred {patient.referredPatients.length} patient{patient.referredPatients.length === 1 ? "" : "s"}
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {patient.referredPatients.map((r: any) => (
                    <li key={r.id}>
                      <Link href={`/admin/patients/${r.id}`} className="hover:text-forest">
                        {r.name}
                      </Link>
                      <span className="text-xs text-ink/70"> · {fmtDate(r.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>
      )}

      {tab === "packages" && (
        <div className="space-y-4">
          {patient.packages.map((pkg: any) => (
            <Card key={pkg.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display">{pkg.name}</p>
                    <span className="rounded-full bg-sand px-2 py-0.5 text-xs">
                      {pkg.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink/70">
                    {pkg.usedSessions}/{pkg.totalSessions} sessions used ·{" "}
                    {fmtDate(pkg.startDate)}
                    {pkg.endDate ? ` – ${fmtDate(pkg.endDate)}` : ""} · Total {inr(pkg.price)}
                  </p>
                </div>
                <div className="flex gap-3 text-xs">
                  {pkg.status === "ACTIVE" && pkg.usedSessions < pkg.totalSessions && (
                    <button
                      onClick={() => {
                        setSessionFormPkg(sessionFormPkg === pkg.id ? null : pkg.id);
                        setSessionForm({ doctorId: "", date: "", notes: "" });
                      }}
                      className="font-medium text-forest hover:text-forest-deep"
                    >
                      + Log session
                    </button>
                  )}
                  {pkg.status !== "REFUNDED" && (
                    <>
                      <button onClick={() => packageAction(pkg.id, pkg.status === "FROZEN" ? "unfreeze" : "freeze")} className="text-ink/60 hover:text-ink">
                        {pkg.status === "FROZEN" ? "Unfreeze" : "Freeze"}
                      </button>
                      <button onClick={() => packageAction(pkg.id, "extend")} className="text-ink/60 hover:text-ink">
                        Extend
                      </button>
                      <button onClick={() => packageAction(pkg.id, "refund")} className="text-clay hover:text-clay/80">
                        Refund
                      </button>
                      <button onClick={() => startEditPkg(pkg)} className="text-ink/60 hover:text-ink">
                        Edit
                      </button>
                    </>
                  )}
                  <button onClick={() => setDeletePkgTarget({ id: pkg.id, name: pkg.name })} className="text-clay/70 hover:text-clay">
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full bg-forest"
                  style={{ width: `${Math.min(100, (pkg.usedSessions / pkg.totalSessions) * 100)}%` }}
                />
              </div>

              {editingPkgId === pkg.id && (
                <form onSubmit={(e) => savePkgEdit(e, pkg.id)} className="mt-4 grid grid-cols-1 gap-3 border-t border-sand/60 pt-4 sm:grid-cols-3">
                  <input
                    required
                    placeholder="Package name"
                    value={pkgEditForm.name}
                    onChange={(e) => setPkgEditForm({ ...pkgEditForm, name: e.target.value })}
                    className="rounded-lg border border-sand px-3 py-2 text-sm"
                  />
                  <input
                    required
                    type="number"
                    min={1}
                    placeholder="Total sessions"
                    value={pkgEditForm.totalSessions}
                    onChange={(e) => setPkgEditForm({ ...pkgEditForm, totalSessions: e.target.value })}
                    className="rounded-lg border border-sand px-3 py-2 text-sm"
                  />
                  <input
                    required
                    type="number"
                    min={1}
                    placeholder="Price"
                    value={pkgEditForm.price}
                    onChange={(e) => setPkgEditForm({ ...pkgEditForm, price: e.target.value })}
                    className="rounded-lg border border-sand px-3 py-2 text-sm"
                  />
                  <div className="col-span-full flex gap-3">
                    <button
                      disabled={savingPkgEdit}
                      className="rounded-lg bg-forest px-4 py-2 text-xs font-medium text-cream hover:bg-forest-deep disabled:opacity-60"
                    >
                      {savingPkgEdit ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPkgId(null)}
                      className="rounded-lg px-4 py-2 text-xs text-ink/60 hover:bg-sand/60"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {sessionFormPkg === pkg.id && (
                <form onSubmit={(e) => logSession(e, pkg.id)} className="mt-4 grid grid-cols-1 gap-3 border-t border-sand/60 pt-4 sm:grid-cols-3">
                  <select
                    required
                    value={sessionForm.doctorId}
                    onChange={(e) => setSessionForm({ ...sessionForm, doctorId: e.target.value })}
                    className="rounded-lg border border-sand px-3 py-2 text-sm"
                  >
                    <option value="">— therapist —</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    value={sessionForm.date}
                    onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                    className="rounded-lg border border-sand px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Notes (optional)"
                    value={sessionForm.notes}
                    onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                    className="rounded-lg border border-sand px-3 py-2 text-sm"
                  />
                  <div className="col-span-full flex gap-3">
                    <button
                      disabled={loggingSession}
                      className="rounded-lg bg-forest px-4 py-2 text-xs font-medium text-cream hover:bg-forest-deep disabled:opacity-60"
                    >
                      {loggingSession ? "Saving…" : "Mark session done"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionFormPkg(null)}
                      className="rounded-lg px-4 py-2 text-xs text-ink/60 hover:bg-sand/60"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {pkg.sessions?.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-sand/60 pt-4">
                  {pkg.sessions.map((s: any) => (
                    <li key={s.id} className="flex items-start justify-between text-xs">
                      <div>
                        <span className="font-medium text-ink">{fmtDate(s.date)}</span>
                        <span className="text-ink/70"> · {s.doctor.name}</span>
                        {s.notes && <p className="mt-0.5 text-ink/60">{s.notes}</p>}
                      </div>
                      <button onClick={() => undoSession(s.id)} className="text-clay/70 hover:text-clay">
                        Undo
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
          <Card>
            <p className="font-data text-[10px] uppercase tracking-widest text-ink/65">New package</p>
            <p className="mt-1 text-xs text-ink/65">Full amount is invoiced and marked paid immediately.</p>
            <form onSubmit={addPackage} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
              <input
                required
                placeholder="Package name"
                value={pkgForm.name}
                onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                className="rounded-lg border border-sand px-3 py-2 text-sm"
              />
              <input
                required
                type="number"
                placeholder="Sessions"
                value={pkgForm.totalSessions}
                onChange={(e) => setPkgForm({ ...pkgForm, totalSessions: e.target.value })}
                className="rounded-lg border border-sand px-3 py-2 text-sm"
              />
              <input
                required
                type="number"
                placeholder="Price"
                value={pkgForm.price}
                onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })}
                className="rounded-lg border border-sand px-3 py-2 text-sm"
              />
              <select
                required
                value={pkgForm.paymentMode}
                onChange={(e) => setPkgForm({ ...pkgForm, paymentMode: e.target.value })}
                className="rounded-lg border border-sand px-3 py-2 text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Netbanking">Netbanking</option>
              </select>
              <button
                disabled={savingPkg}
                className="rounded-lg bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-60"
              >
                {savingPkg ? "Adding…" : "Add"}
              </button>
            </form>
          </Card>
        </div>
      )}

      {tab === "notes" && (
        <div className="space-y-4">
          {patient.clinicalNotes.map((n: any) => (
            <Card key={n.id}>
              <p className="text-xs text-ink/70">
                {fmtDate(n.date)} · {n.author.name}
              </p>
              <p className="mt-2 text-sm">{n.note}</p>
              {n.attachments && n.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {n.attachments.map((att: any, i: number) => (
                    att.type.startsWith("image/") ? (
                      <a key={i} href={att.data} target="_blank" rel="noreferrer">
                        <img src={att.data} alt={att.name} className="h-24 w-24 object-cover rounded-lg border border-sand hover:opacity-80 transition-opacity" />
                      </a>
                    ) : (
                      <a key={i} href={att.data} download={att.name} className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-sand bg-sand/30 p-2 text-center text-xs text-ink/60 hover:text-ink transition-colors">
                        <svg className="mb-1 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="truncate w-full">{att.name}</span>
                      </a>
                    )
                  ))}
                </div>
              )}
            </Card>
          ))}
          {patient.clinicalNotes.length === 0 && (
            <p className="text-sm text-ink/65">No clinical notes yet.</p>
          )}
          <Card>
            <form onSubmit={addNote} className="space-y-3">
              <textarea
                placeholder="Add a clinical note…"
                value={noteForm}
                onChange={(e) => setNoteForm(e.target.value)}
                className="w-full rounded-lg border border-sand px-3 py-2 text-sm min-h-[80px]"
              />
              <div className="flex items-center justify-between">
                <input
                  type="file"
                  multiple
                  onChange={(e) => setNoteAttachments(Array.from(e.target.files || []))}
                  className="text-xs text-ink/60 file:mr-4 file:rounded-full file:border-0 file:bg-sand file:px-4 file:py-2 file:text-xs file:font-medium hover:file:bg-sand/80"
                />
                <button className="rounded-lg bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-deep">
                  Save Note
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {tab === "invoices" && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand text-left text-[10px] uppercase tracking-widest text-ink/65">
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Paid</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {patient.invoices.map((inv: any) => (
                <tr key={inv.id} className="border-b border-sand/60 last:border-0 hover:bg-sand/20">
                  <td className="px-6 py-3">
                    <Link href={`/admin/invoices/${inv.id}`} className="font-data hover:text-forest">
                      {inv.number}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-ink/70">{fmtDate(inv.date)}</td>
                  <td className="px-6 py-3 font-data">{inr(inv.total)}</td>
                  <td className="px-6 py-3 font-data">{inr(inv.paidAmount)}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      inv.status === "PAID"
                        ? "bg-forest/10 text-forest"
                        : inv.status === "PARTIAL"
                        ? "bg-clay-light text-clay"
                        : "bg-sand text-ink/60"
                    }`}>
                      {inv.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-3 text-xs font-medium">
                      <Link href={`/admin/invoices/${inv.id}`} className="text-ink/70 hover:text-ink">
                        View
                      </Link>
                      <Link href={`/admin/invoices/${inv.id}?edit=true`} className="text-ink/70 hover:text-ink">
                        Edit
                      </Link>
                      <button onClick={() => handleDeleteInvoice(inv.id)} className="text-clay/70 hover:text-clay">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "appointments" && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand text-left text-[10px] uppercase tracking-widest text-ink/65">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Doctor</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {patient.appointments.map((a: any) => (
                <tr key={a.id} className="border-b border-sand/60 last:border-0 hover:bg-sand/20">
                  <td className="px-6 py-3 text-ink/70">
                    {new Date(a.datetime).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-3">{a.doctor.name}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-sand px-2 py-0.5 text-xs">
                      {a.status.toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {deletePkgTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <Card className="w-full max-w-sm">
            <h2 className="font-display text-lg">Delete package?</h2>
            <p className="mt-2 text-sm text-ink/70">
              This will remove <span className="font-medium text-ink">{deletePkgTarget.name}</span> and its invoice
              from this patient&apos;s totals. This can&apos;t be undone from here.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletePkgTarget(null)}
                disabled={deletingPkg}
                className="rounded-lg px-4 py-2 text-sm text-ink/60 hover:bg-sand/60 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePkg}
                disabled={deletingPkg}
                className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-cream hover:bg-clay/90 disabled:opacity-60"
              >
                {deletingPkg ? "Deleting…" : "Delete package"}
              </button>
            </div>
          </Card>
        </div>
      )}

      {confirmExtraPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <Card className="w-full max-w-sm">
            <h2 className="font-display text-lg">Add another package?</h2>
            <p className="mt-2 text-sm text-ink/70">
              This patient already has{" "}
              <span className="font-medium text-ink">
                {patient.packages.filter((p: any) => p.status === "ACTIVE").length} active package(s)
              </span>{" "}
              totalling{" "}
              <span className="font-medium text-ink">
                {inr(
                  patient.packages
                    .filter((p: any) => p.status === "ACTIVE")
                    .reduce((s: number, p: any) => s + Number(p.price), 0)
                )}
              </span>
              . If they just need more sessions on the existing package, use{" "}
              <span className="font-medium text-ink">Extend</span> instead — this creates a brand new
              package and invoice.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmExtraPkg(false)}
                disabled={savingPkg}
                className="rounded-lg px-4 py-2 text-sm text-ink/60 hover:bg-sand/60 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => addPackage()}
                disabled={savingPkg}
                className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-cream hover:bg-clay/90 disabled:opacity-60"
              >
                {savingPkg ? "Adding…" : "Create anyway"}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
