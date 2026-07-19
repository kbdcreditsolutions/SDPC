import { getDashboardData } from "@/lib/queries/dashboard";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return <p className="text-sm text-ink/50">Unable to load dashboard data.</p>;
  }

  return <DashboardClient initialData={data} />;
}
