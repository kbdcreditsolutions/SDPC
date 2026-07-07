"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("UPI");

  const load = useCallback(async () => {
    const res = await fetch(`/api/invoices/${id}`);
    const data = await res.json();
    setInvoice(data.invoice);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/invoices/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: payMethod, amount: Number(payAmount) }),
    });
    setPayAmount("");
    load();
  }

  if (!invoice) return <p className="text-sm text-ink/50">Loading…</p>;

  const balance = invoice.total - invoice.paidAmount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/app/invoices" className="text-sm text-ink/50 hover:text-ink">
          ← All invoices
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded-full border border-ink/15 px-5 py-2 text-sm hover:border-ink/30"
        >
          Print
        </button>
      </div>

      <div className="rounded-2xl border border-sand bg-white p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">
              Tax invoice
            </p>
            <p className="mt-1 font-display text-2xl">{invoice.number}</p>
            <p className="mt-1 text-sm text-ink/50">Issued {fmtDate(invoice.date)}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-display">{invoice.tenant.name}</p>
            <p className="text-ink/50">{invoice.tenant.address}</p>
            {invoice.tenant.gstNumber && (
              <p className="text-ink/50">GSTIN: {invoice.tenant.gstNumber}</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-start justify-between">
          <div>
            <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">
              Billed to
            </p>
            <p className="mt-1 font-medium">{invoice.patient.name}</p>
            <p className="text-sm text-ink/50">{invoice.patient.phone}</p>
            <p className="text-sm text-ink/50">{invoice.patient.address}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs uppercase ${
              invoice.status === "PAID"
                ? "bg-forest/10 text-forest"
                : invoice.status === "PARTIAL"
                ? "bg-clay-light text-clay"
                : "bg-sand text-ink/60"
            }`}
          >
            {invoice.status}
          </span>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-sand text-left text-[10px] uppercase tracking-widest text-ink/40">
              <th className="py-2">Description</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Unit</th>
              <th className="py-2">GST</th>
              <th className="py-2 text-right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li: any) => (
              <tr key={li.id} className="border-b border-sand/60">
                <td className="py-2">{li.description}</td>
                <td className="py-2">{li.qty}</td>
                <td className="py-2">{inr(li.unitPrice)}</td>
                <td className="py-2">{li.gstPercent}%</td>
                <td className="py-2 text-right font-data">{inr(li.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-ink/50">Subtotal</span>
            <span className="font-data">{inr(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/50">GST</span>
            <span className="font-data">{inr(invoice.gst)}</span>
          </div>
          <div className="flex justify-between border-t border-sand pt-1 font-medium">
            <span>Total</span>
            <span className="font-data text-lg">{inr(invoice.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/50">Paid</span>
            <span className="font-data">{inr(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Balance</span>
            <span className="font-data">{inr(balance)}</span>
          </div>
        </div>

        {invoice.payments.length > 0 && (
          <div className="mt-8">
            <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">
              Payments received
            </p>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {invoice.payments.map((p: any) => (
                  <tr key={p.id} className="border-b border-sand/60">
                    <td className="py-2">{p.method}</td>
                    <td className="py-2 text-ink/50">{fmtDate(p.date)}</td>
                    <td className="py-2 text-right font-data">{inr(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {balance > 0 && (
        <form onSubmit={recordPayment} className="flex items-end gap-3 print:hidden">
          <div>
            <label className="text-xs text-ink/60">Method</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="mt-1 rounded-lg border border-sand px-3 py-2 text-sm"
            >
              {["Cash", "UPI", "Card", "Netbanking"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink/60">Amount</label>
            <input
              required
              type="number"
              max={balance}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="mt-1 w-32 rounded-lg border border-sand px-3 py-2 text-sm"
            />
          </div>
          <button className="rounded-lg bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep">
            Record payment
          </button>
        </form>
      )}
    </div>
  );
}
