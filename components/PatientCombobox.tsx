"use client";

import { useEffect, useRef, useState } from "react";

export type PatientOption = { id: string; name: string; phone: string };

export function PatientCombobox({
  patients,
  value,
  onChange,
  required,
  label = "Patient",
}: {
  patients: PatientOption[];
  value: string;
  onChange: (patientId: string) => void;
  required?: boolean;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const selected = patients.find((p) => p.id === value);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const matches = patients
    .filter((p) => {
      const q = query.trim().toLowerCase();
      return p.name.toLowerCase().includes(q) || p.phone.includes(q);
    })
    .slice(0, 20);

  return (
    <div className="relative" ref={boxRef}>
      <label className="text-xs text-ink/60">
        {label}
        {required ? "*" : ""}
      </label>
      {selected ? (
        <div className="mt-1 flex items-center justify-between rounded-lg border border-sand bg-sand/20 px-3 py-2 text-sm">
          <span>
            {selected.name} <span className="text-ink/60">{selected.phone}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
            className="text-xs text-ink/50 hover:text-clay"
          >
            Change
          </button>
        </div>
      ) : (
        <input
          required={required}
          placeholder="Search by name or phone…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Typing a query without clicking a result must not satisfy
            // `required` — clear it back to an empty (invalid) field.
            setTimeout(() => {
              if (!value) setQuery("");
            }, 150);
          }}
          className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm"
        />
      )}
      {open && !selected && query.trim().length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-sand bg-white shadow-lg">
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={() => {
                  onChange(p.id);
                  setQuery("");
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-sand/40"
              >
                {p.name} <span className="text-ink/60">{p.phone}</span>
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="px-3 py-2 text-sm text-ink/50">No matches</li>}
        </ul>
      )}
    </div>
  );
}
