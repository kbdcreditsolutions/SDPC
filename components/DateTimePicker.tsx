"use client";

import { useEffect, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";

// Value/onChange use the same "YYYY-MM-DDTHH:mm" shape as a native
// datetime-local input, so this drops into existing form state untouched.
function parseValue(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function toValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 15, 30, 45];

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseValue(value);
  const [viewMonth, setViewMonth] = useState(() => selected ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) setViewMonth(selected);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const hour24 = selected ? selected.getHours() : null;
  const hour12 = hour24 === null ? null : ((hour24 + 11) % 12) + 1;
  const minute = selected ? selected.getMinutes() : null;
  const isPM = hour24 === null ? false : hour24 >= 12;

  function commit(next: Date) {
    onChange(toValue(next));
  }

  function pickDay(day: Date) {
    const base = new Date(day);
    base.setHours(selected?.getHours() ?? 9, selected?.getMinutes() ?? 0, 0, 0);
    commit(base);
  }

  function setHour12(h: number) {
    const base = new Date(selected ?? viewMonth);
    const pm = selected ? isPM : false;
    base.setHours((h % 12) + (pm ? 12 : 0), selected?.getMinutes() ?? 0, 0, 0);
    commit(base);
  }

  function setMinute(m: number) {
    const base = new Date(selected ?? viewMonth);
    base.setMinutes(m, 0, 0);
    commit(base);
  }

  function setPeriod(pm: boolean) {
    const base = new Date(selected ?? viewMonth);
    const currentHour12 = hour12 ?? 12;
    base.setHours((currentHour12 % 12) + (pm ? 12 : 0));
    commit(base);
  }

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingBlanks = getDay(monthStart);
  const today = new Date();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-sand bg-white px-3 py-2 text-left text-sm"
      >
        <span className={selected ? "text-ink" : "text-ink/45"}>
          {selected ? format(selected, "d MMM yyyy, h:mm a") : placeholder}
        </span>
        <Calendar className="h-4 w-4 text-ink/50" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-72 rounded-xl border border-sand bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="rounded-full p-1 text-ink/60 hover:bg-sand/60"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium">{format(viewMonth, "MMMM yyyy")}</p>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="rounded-full p-1 text-ink/60 hover:bg-sand/60"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-y-1 text-center text-[10px] uppercase tracking-wide text-ink/50">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {days.map((day) => {
              const isSelected = selected && isSameDay(day, selected);
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => pickDay(day)}
                  className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                    isSelected
                      ? "bg-forest text-cream"
                      : isToday
                      ? "border border-forest text-forest"
                      : "text-ink hover:bg-sand/60"
                  } ${!isSameMonth(day, viewMonth) ? "text-ink/30" : ""}`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-sand pt-3">
            <Clock className="h-4 w-4 shrink-0 text-ink/50" />
            <select
              value={hour12 ?? ""}
              onChange={(e) => setHour12(Number(e.target.value))}
              className="rounded-lg border border-sand px-2 py-1.5 text-sm"
            >
              {hour12 === null && <option value="">--</option>}
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="text-ink/50">:</span>
            <select
              value={minute === null ? "" : MINUTES.includes(minute) ? minute : ""}
              onChange={(e) => setMinute(Number(e.target.value))}
              className="rounded-lg border border-sand px-2 py-1.5 text-sm"
            >
              {(minute === null || !MINUTES.includes(minute)) && (
                <option value="">{minute === null ? "--" : String(minute).padStart(2, "0")}</option>
              )}
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
            <div className="ml-auto flex overflow-hidden rounded-lg border border-sand text-xs">
              <button
                type="button"
                onClick={() => setPeriod(false)}
                className={`px-2 py-1.5 ${!isPM && selected ? "bg-forest text-cream" : "text-ink/70 hover:bg-sand/60"}`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setPeriod(true)}
                className={`px-2 py-1.5 ${isPM && selected ? "bg-forest text-cream" : "text-ink/70 hover:bg-sand/60"}`}
              >
                PM
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-sand pt-3">
            <button
              type="button"
              onClick={() => {
                commit(new Date());
              }}
              className="text-xs font-medium text-forest hover:underline"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-forest px-3 py-1.5 text-xs font-medium text-cream hover:bg-forest-deep"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
