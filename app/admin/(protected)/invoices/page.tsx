import { getInvoices } from "@/lib/queries/invoices";
import InvoicesClient from "./InvoicesClient";

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  const serialized = invoices.map((i) => ({
    ...i,
    date: i.date.toISOString(),
  }));

  return <InvoicesClient initialInvoices={serialized} />;
}
