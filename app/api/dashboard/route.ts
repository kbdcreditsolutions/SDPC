import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/guard";
import { getDashboardDataForSession, istDateKey, istDayBounds, addDaysToKey } from "@/lib/queries/dashboard";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const { session, response } = await requireSession();
  if (!session) return response!;

  const fromParam = req.nextUrl.searchParams.get("from");
  const toParam = req.nextUrl.searchParams.get("to");

  const now = new Date();
  const todayKey = istDateKey(now);

  const fromKey = fromParam ?? addDaysToKey(todayKey, -30);
  const toKey = toParam ?? todayKey;

  // Regex checks format only — Date.UTC silently rolls over out-of-range
  // components (e.g. "2026-13-99" → some later valid date) instead of
  // producing NaN, so round-trip the key through istDateKey to catch it.
  if (!DATE_KEY_RE.test(fromKey) || istDateKey(istDayBounds(fromKey).start) !== fromKey) {
    return NextResponse.json({ error: "Invalid 'from' date — expected YYYY-MM-DD" }, { status: 400 });
  }
  if (!DATE_KEY_RE.test(toKey) || istDateKey(istDayBounds(toKey).start) !== toKey) {
    return NextResponse.json({ error: "Invalid 'to' date — expected YYYY-MM-DD" }, { status: 400 });
  }

  const from = istDayBounds(fromKey).start;
  const to = istDayBounds(toKey).end;

  if (from > to) {
    return NextResponse.json({ error: "'from' must be before 'to'" }, { status: 400 });
  }

  const data = await getDashboardDataForSession(session, { from, to });
  return NextResponse.json(data);
}
