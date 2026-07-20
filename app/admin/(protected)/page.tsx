import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries/dashboard";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (session?.role === "STAFF") redirect("/admin/patients");

  const data = await getDashboardData();

  if (!data) {
    return <p className="text-sm text-ink/70">Unable to load dashboard data.</p>;
  }

  return <DashboardClient initialData={data} />;
}
