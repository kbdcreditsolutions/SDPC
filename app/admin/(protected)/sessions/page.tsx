import { getPackageSessions } from "@/lib/queries/sessions";
import SessionsClient from "./SessionsClient";

export default async function SessionsPage() {
  const sessions = await getPackageSessions();

  const serialized = sessions.map((s) => ({
    ...s,
    date: s.date.toISOString(),
    createdAt: s.createdAt.toISOString(),
  }));

  return <SessionsClient initialSessions={serialized} />;
}
