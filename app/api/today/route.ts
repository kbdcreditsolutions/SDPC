import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getToday } from "@/lib/queries/today";

export async function GET() {
  // getToday() returns an empty day for an unauthenticated caller; the client
  // needs to tell that apart from "quiet clinic", hence the explicit 401 here.
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(await getToday());
}
