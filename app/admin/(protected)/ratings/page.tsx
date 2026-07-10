import { getRatings } from "@/lib/queries/ratings";
import RatingsClient from "./RatingsClient";

export default async function RatingsPage() {
  const data = await getRatings();

  const serialized = {
    ...data,
    recent: data.recent.map((r) => ({ ...r, date: r.date.toISOString() })),
  };

  return <RatingsClient initialData={serialized} />;
}
