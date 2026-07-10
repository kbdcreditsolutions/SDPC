import { getMarketing } from "@/lib/queries/marketing";
import MarketingClient from "./MarketingClient";

export default async function MarketingPage() {
  const data = await getMarketing();

  const serialized = {
    ...data,
    campaigns: data.campaigns.map((c) => ({ ...c, startDate: c.startDate.toISOString(), endDate: c.endDate?.toISOString() ?? null })),
    referrals: data.referrals.map((r) => ({ ...r, date: r.date.toISOString() })),
  };

  return <MarketingClient initialData={serialized} />;
}
