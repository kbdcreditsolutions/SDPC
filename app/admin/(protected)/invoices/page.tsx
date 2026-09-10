import { Suspense } from "react";
import { getInvoices } from "@/lib/queries/invoices";
import InvoicesClient from "./InvoicesClient";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const invoices = await getInvoices({ from: sp.from, to: sp.to, status: sp.status });

  const serialized = invoices.map((i) => ({
    ...i,
    date: i.date.toISOString(),
  }));

  return (
    <Suspense fallback={null}>
      <InvoicesClient initialInvoices={serialized} />
    </Suspense>
  );
}
