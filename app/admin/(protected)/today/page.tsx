import { getSession } from "@/lib/auth";
import { getToday } from "@/lib/queries/today";
import TodayClient from "./TodayClient";

export default async function TodayPage() {
  const [session, data] = await Promise.all([getSession(), getToday()]);

  // A DOCTOR gets their own day read-only: POST /api/visits is CLINIC_ADMIN/STAFF,
  // so showing them a button would only surface a raw "Forbidden".
  return (
    <TodayClient
      initialData={data}
      canUndo={session?.role === "CLINIC_ADMIN"}
      canLog={session?.role === "CLINIC_ADMIN" || session?.role === "STAFF"}
    />
  );
}
