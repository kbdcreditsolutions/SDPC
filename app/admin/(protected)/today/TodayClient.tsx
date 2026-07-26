"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import type { TodayData, TodayPackage } from "@/lib/queries/today";

type Doctor = { id: string; name: string; specialty: string | null };

type SearchResult = {
  id: string;
  name: string;
  phone: string;
  pid: string | null;
  reason: string | null;
};

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

function prettyDate(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// One row's in-progress state: which patient is being logged, and the extra
// answers needed when the one-tap path isn't unambiguous.
type Draft = {
  key: string;
  patientId: string;
  appointmentId?: string;
  packages: TodayPackage[];
  packageId: string;
  doctorId: string;
  needsDoctor: boolean;
  confirmDuplicate: boolean;
};

export default function TodayClient({
  initialData,
  canUndo,
  canLog,
}: {
  initialData: TodayData;
  canUndo: boolean;
  canLog: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  // Keyed by row, but also tracked by patient: the same patient can appear both
  // in the booked list and in search results, and those two rows must not be
  // clickable at the same time.
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [busyPatientId, setBusyPatientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Two clicks in the same tick both run before `busyPatientId` re-renders the
  // button as disabled. The server's advisory lock keeps the data right, but the
  // loser would surface a bogus "already logged today — log another?" prompt.
  const submitting = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/doctors/")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        if (!cancelled) setDoctors(d.doctors ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setDoctors([]);
        // Without this list the walk-in draft's Therapist select is empty, so
        // "Log visit" can never enable. Silence would read as a dead button.
        setError("Couldn't load the therapist list. Reload the page before logging a walk-in.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // A pending debounce must not fire after navigating away.
  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    []
  );

  const refresh = useCallback(async () => {
    // A silent failure here would leave stale rows on screen and invite a
    // second tap on a visit that was already saved.
    try {
      const res = await fetch("/api/today/");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("Saved, but this list is out of date — reload the page to see today's actual state.");
    }
  }, []);

  // Patients already seen today, so a booking that's been dealt with reads as
  // done instead of still looking like work.
  const loggedPatientIds = new Set(data.logged.map((s) => s.patient.id));

  function runSearch(value: string) {
    setQ(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients/?lite=1&q=${encodeURIComponent(value.trim())}`);
        if (!res.ok) throw new Error();
        const d = await res.json();
        setResults(d.patients ?? []);
        // A search that succeeds must clear a stale failure notice, or good
        // results sit under "Search failed…".
        setError((e) => (e && e.startsWith("Search failed") ? null : e));
      } catch {
        // Distinguish "search failed" from "no such patient" — the second one
        // is what sends staff off to create a duplicate record.
        setResults(null);
        setError("Search failed. Check your connection and try again before adding a new patient.");
      } finally {
        setSearching(false);
      }
    }, 250);
  }

  // Throws rather than returning [] — an empty list renders as the factual
  // claim "no active package", which a network error must not masquerade as.
  async function fetchPackages(patientId: string): Promise<TodayPackage[]> {
    const res = await fetch(`/api/patients/${patientId}/packages/`);
    if (!res.ok) throw new Error("PACKAGES_UNAVAILABLE");
    const d = await res.json();
    return (d.packages ?? [])
      .filter(
        (p: TodayPackage & { status: string }) =>
          p.status === "ACTIVE" && p.usedSessions < p.totalSessions
      )
      .map((p: TodayPackage) => ({
        id: p.id,
        name: p.name,
        totalSessions: p.totalSessions,
        usedSessions: p.usedSessions,
      }));
  }

  // Booked patients arrive with their packages already loaded; searched ones
  // need a lookup before we know whether a single tap is enough.
  async function beginBooking(appt: TodayData["appointments"][number]) {
    setError(null);
    if (appt.packages.length === 1) {
      await submit({
        key: appt.id,
        patientId: appt.patient.id,
        appointmentId: appt.id,
        packages: appt.packages,
        packageId: appt.packages[0].id,
        doctorId: appt.doctor.id,
        needsDoctor: false,
        confirmDuplicate: false,
      });
      return;
    }
    setDraft({
      key: appt.id,
      patientId: appt.patient.id,
      appointmentId: appt.id,
      packages: appt.packages,
      packageId: "",
      doctorId: appt.doctor.id,
      needsDoctor: false,
      confirmDuplicate: false,
    });
  }

  async function beginWalkIn(patient: SearchResult) {
    setError(null);
    setBusyKey(patient.id);
    setBusyPatientId(patient.id);
    try {
      const packages = await fetchPackages(patient.id);
      setDraft({
        key: patient.id,
        patientId: patient.id,
        packages,
        packageId: packages.length === 1 ? packages[0].id : "",
        doctorId: "",
        needsDoctor: true,
        confirmDuplicate: false,
      });
    } catch {
      setError("Couldn't load this patient's packages. Check your connection and try again.");
    } finally {
      setBusyKey(null);
      setBusyPatientId(null);
    }
  }

  async function submit(d: Draft) {
    if (submitting.current) return;
    submitting.current = true;
    setError(null);
    setBusyKey(d.key);
    setBusyPatientId(d.patientId);
    try {
      // The appointment shape takes its therapist from the booking, so once a
      // replacement has been picked by hand the visit has to be sent as a
      // walk-in — /api/visits would otherwise strip the doctorId.
      const payload =
        d.appointmentId && !d.needsDoctor
          ? { appointmentId: d.appointmentId, packageId: d.packageId || undefined }
          : { patientId: d.patientId, packageId: d.packageId, doctorId: d.doctorId };
      const res = await fetch("/api/visits/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, ...(d.confirmDuplicate ? { force: true } : {}) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 409 && err.alreadyLogged) {
          setDraft({ ...d, confirmDuplicate: true });
          return;
        }
        // A booking whose therapist has since been deactivated can't be logged
        // with the therapist off the appointment — reopen the draft so a
        // replacement can be picked instead of leaving a dead-end error.
        if (err.error === "Therapist not found" && d.appointmentId) {
          setDraft({ ...d, doctorId: "", needsDoctor: true, confirmDuplicate: false });
          setError("That booking's therapist is no longer active. Pick who actually saw this patient.");
          return;
        }
        setError(err.error ?? "Could not log this visit.");
        return;
      }
      setDraft(null);
      await refresh();
    } catch {
      setError("Could not log this visit. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setBusyKey(null);
      setBusyPatientId(null);
    }
  }

  async function undo(sessionId: string) {
    setError(null);
    setBusyKey(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Could not undo this session.");
        return;
      }
      await refresh();
    } catch {
      setError("Could not undo this session. Check your connection and try again.");
    } finally {
      setBusyKey(null);
    }
  }

  const scheduled = data.appointments.filter((a) => a.status !== "CANCELLED");

  function draftPanel(d: Draft, patientName: string) {
    const ready = d.packageId && (!d.needsDoctor || d.doctorId);
    return (
      <div className="mt-3 rounded-xl border border-sand bg-sand/20 p-3">
        {d.confirmDuplicate ? (
          <div className="text-sm text-clay">
            <p>{patientName} already has a session logged today. Log another one anyway?</p>
            {/* Undo is CLINIC_ADMIN-only, so staff need to know this one is
                one-way before they confirm it. */}
            {!canUndo && (
              <p className="mt-1 text-xs">
                A second session uses up another paid session, and only a clinic admin can reverse it.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {d.packages.length === 0 ? (
              <p className="text-sm text-ink/70 sm:col-span-2">
                No active package with sessions left.{" "}
                <Link href={`/admin/patients/${d.patientId}`} className="text-forest underline">
                  Add a package first
                </Link>
                .
              </p>
            ) : (
              <div>
                <label className="text-xs text-ink/60">Package</label>
                <select
                  value={d.packageId}
                  onChange={(e) => setDraft({ ...d, packageId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm"
                >
                  <option value="">— select —</option>
                  {d.packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.usedSessions}/{p.totalSessions} used
                    </option>
                  ))}
                </select>
              </div>
            )}
            {d.needsDoctor && d.packages.length > 0 && (
              <div>
                <label className="text-xs text-ink/60">Therapist</label>
                <select
                  value={d.doctorId}
                  onChange={(e) => setDraft({ ...d, doctorId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm"
                >
                  <option value="">— select —</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
        <div className="mt-3 flex items-center gap-3">
          {(d.confirmDuplicate || d.packages.length > 0) && (
            <button
              type="button"
              disabled={busyKey === d.key || (!d.confirmDuplicate && !ready)}
              onClick={() => submit(d)}
              className="rounded-lg bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-50"
            >
              {busyKey === d.key ? "Saving…" : d.confirmDuplicate ? "Yes, log it" : "Log visit"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDraft(null)}
            className="rounded-lg px-3 py-2 text-sm text-ink/60 hover:bg-sand/60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Today</h1>
        <p className="mt-1 text-sm text-ink/60">{prettyDate(data.dateKey)}</p>
      </div>

      <Card>
        <label htmlFor="today-search" className="text-xs text-ink/60">
          Find the patient first
        </label>
        <input
          id="today-search"
          value={q}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="Name, phone, or patient ID"
          className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-3 text-base text-ink focus:outline-none focus:ring-1 focus:ring-forest"
        />
        <p className="mt-2 text-xs text-ink/60">
          Coming for the first time?{" "}
          <Link href="/admin/patients" className="text-forest underline">
            Register a new patient
          </Link>{" "}
          — existing patients never need a second record.
        </p>

        {q.trim() && (
          <div className="mt-4 border-t border-sand pt-3">
            {searching && <p className="text-sm text-ink/60">Searching…</p>}
            {!searching && results?.length === 0 && (
              <p className="text-sm text-ink/70">
                No patient matches “{q.trim()}”. If this is their first visit,{" "}
                <Link href="/admin/patients" className="text-forest underline">
                  register them
                </Link>
                .
              </p>
            )}
            {!searching &&
              results?.map((p) => (
                <div key={p.id} className="border-b border-sand/60 py-3 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/admin/patients/${p.id}`} className="font-medium hover:text-forest">
                        {p.name}
                      </Link>
                      <p className="text-xs text-ink/60">
                        {p.phone}
                        {p.pid ? ` · ${p.pid}` : ""}
                        {p.reason ? ` · ${p.reason}` : ""}
                      </p>
                    </div>
                    {/* An already-logged patient keeps a (de-emphasised) button:
                        a genuine second visit in one day has to be loggable, and
                        it routes through the same-day confirm on the way. */}
                    <div className="flex shrink-0 items-center gap-3">
                      {loggedPatientIds.has(p.id) && (
                        <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-medium text-forest">
                          Logged today
                        </span>
                      )}
                      {canLog && (
                        <button
                          type="button"
                          disabled={busyPatientId === p.id || draft?.key === p.id}
                          onClick={() => beginWalkIn(p)}
                          className={
                            loggedPatientIds.has(p.id)
                              ? "rounded-full border border-sand px-4 py-2 text-sm text-ink/70 hover:bg-sand/40 disabled:opacity-50"
                              : "rounded-full bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-50"
                          }
                        >
                          {busyKey === p.id ? "…" : loggedPatientIds.has(p.id) ? "Log another" : "Log visit"}
                        </button>
                      )}
                    </div>
                  </div>
                  {draft?.key === p.id && draftPanel(draft, p.name)}
                </div>
              ))}
            {/* The API caps at 20. An invisible 21st match is exactly how a
                duplicate record gets created, so say so. */}
            {!searching && results && results.length >= 20 && (
              <p className="pt-2 text-xs text-ink/60">
                Showing the first 20 matches — type more of the name or phone number to narrow it down.
              </p>
            )}
          </div>
        )}
      </Card>

      {error && (
        <div className="rounded-xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-clay">{error}</div>
      )}

      <div>
        <h2 className="font-display text-xl">Booked today</h2>
        <p className="mt-1 text-sm text-ink/60">{scheduled.length} appointments</p>
        <Card className="mt-3 p-0">
          {scheduled.length === 0 ? (
            <p className="px-6 py-6 text-sm text-ink/65">
              Nothing booked for today. Use the search above for walk-ins.
            </p>
          ) : (
            scheduled.map((a) => {
              const done = loggedPatientIds.has(a.patient.id);
              return (
                <div key={a.id} className="border-b border-sand/60 px-6 py-4 last:border-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-20 shrink-0 text-sm text-ink/60">{timeOf(a.datetime)}</span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/patients/${a.patient.id}`}
                        className="font-medium hover:text-forest"
                      >
                        {a.patient.name}
                      </Link>
                      <p className="text-xs text-ink/60">
                        {a.doctor.name}
                        {a.patient.reason ? ` · ${a.patient.reason}` : ""}
                        {a.packages.length === 1
                          ? ` · session ${a.packages[0].usedSessions + 1} of ${a.packages[0].totalSessions}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {done && (
                        <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-medium text-forest">
                          Logged
                        </span>
                      )}
                      {!canLog ? null : a.packages.length === 0 ? (
                        <Link
                          href={`/admin/patients/${a.patient.id}`}
                          className="rounded-full border border-clay px-4 py-2 text-sm font-medium text-clay hover:bg-clay/10"
                        >
                          Add package
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={busyPatientId === a.patient.id || draft?.key === a.id}
                          onClick={() => beginBooking(a)}
                          className={
                            done
                              ? "rounded-full border border-sand px-4 py-2 text-sm text-ink/70 hover:bg-sand/40 disabled:opacity-50"
                              : "rounded-full bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-50"
                          }
                        >
                          {busyKey === a.id ? "Saving…" : done ? "Log another" : "Mark visit"}
                        </button>
                      )}
                    </div>
                  </div>
                  {draft?.key === a.id && draftPanel(draft, a.patient.name)}
                </div>
              );
            })
          )}
        </Card>
      </div>

      <div>
        <h2 className="font-display text-xl">Logged today</h2>
        <p className="mt-1 text-sm text-ink/60">{data.logged.length} sessions</p>
        <Card className="mt-3 p-0">
          {data.logged.length === 0 ? (
            <p className="px-6 py-6 text-sm text-ink/65">Nothing logged yet today.</p>
          ) : (
            data.logged.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center gap-3 border-b border-sand/60 px-6 py-4 last:border-0"
              >
                <span className="w-20 shrink-0 text-sm text-ink/60">{timeOf(s.date)}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/patients/${s.patient.id}`} className="font-medium hover:text-forest">
                    {s.patient.name}
                  </Link>
                  <p className="text-xs text-ink/60">
                    {s.package.name} · {s.package.usedSessions}/{s.package.totalSessions} used
                    {s.doctor ? ` · ${s.doctor.name}` : ""}
                  </p>
                </div>
                {canUndo && (
                  <button
                    type="button"
                    disabled={busyKey === s.id}
                    onClick={() => undo(s.id)}
                    className="text-sm text-ink/55 hover:text-clay disabled:opacity-50"
                  >
                    {busyKey === s.id ? "…" : "Undo"}
                  </button>
                )}
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
