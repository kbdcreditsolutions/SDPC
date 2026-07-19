// Pure date-math helpers for India's IST timezone (UTC+5:30). No side effects,
// no server-only imports — safe to use from both server code and client
// components, so "today"/"this month"/"this FY" always mean the same
// calendar day regardless of the machine's own timezone (server or browser).
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIST(d: Date) {
  return new Date(d.getTime() + IST_OFFSET_MS);
}

/** "YYYY-MM-DD" representing d's IST calendar date. */
export function istDateKey(d: Date) {
  const ist = toIST(d);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, "0")}-${String(
    ist.getUTCDate()
  ).padStart(2, "0")}`;
}

/** UTC instant range covering the full IST calendar day for a "YYYY-MM-DD" key. */
export function istDayBounds(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - IST_OFFSET_MS);
  const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - IST_OFFSET_MS);
  return { start, end };
}

/** Pure calendar-date arithmetic on a "YYYY-MM-DD" key — no timezone involved. */
export function addDaysToKey(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(
    dt.getUTCDate()
  ).padStart(2, "0")}`;
}

export function fyStartYearFor(now: Date) {
  const ist = toIST(now);
  const istYear = ist.getUTCFullYear();
  const istMonth = ist.getUTCMonth(); // 0-indexed; April = 3
  return istMonth >= 3 ? istYear : istYear - 1;
}

// Indian financial year: 1 April – 31 March, IST
export function financialYearRange(now: Date) {
  const fyStartYear = fyStartYearFor(now);
  const { start } = istDayBounds(`${fyStartYear}-04-01`);
  return { start, end: now };
}
export function previousFinancialYearRange(now: Date) {
  const fyStartYear = fyStartYearFor(now);
  const { start } = istDayBounds(`${fyStartYear - 1}-04-01`);
  const { end } = istDayBounds(`${fyStartYear}-03-31`);
  return { start, end };
}

/** Start of the current IST calendar month, as a "YYYY-MM-DD" key. */
export function istMonthStartKey(now: Date) {
  const ist = toIST(now);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, "0")}-01`;
}
