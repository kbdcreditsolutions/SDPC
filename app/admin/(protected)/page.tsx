import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries/dashboard";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  // Staff start their day on Today, not on a records list — the first screen
  // should be "who's here now", not "add a patient".
  if (session?.role === "STAFF") redirect("/admin/today");

  const data = await getDashboardData();

  if (!data) {
    return <p className="text-sm text-ink/70">Unable to load dashboard data.</p>;
  }

  return <DashboardClient initialData={data} />;
}
