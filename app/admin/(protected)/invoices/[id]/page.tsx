"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = use(params);
  const search = use(searchParams);
  const [invoice, setInvoice] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("UPI");
  
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(search.edit === "true");
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [patientId, setPatientId] = useState("");
  const [items, setItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/invoices/${id}/`);
    const data = await res.json();
    setInvoice(data.invoice);
    setPatientId(data.invoice.patientId || data.invoice.patient.id);
    setItems(data.invoice.lineItems.map((li: any) => ({
      description: li.description,
      qty: String(li.qty),
      unitPrice: String(li.unitPrice),
      gstPercent: String(li.gstPercent)
    })));
  }, [id]);

  useEffect(() => {
    load();
    fetch("/api/patients/")
      .then((r) => r.json())
      .then((d) => setPatients(d.patients));
  }, [load]);

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/invoices/${id}/pay/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: payMethod, amount: Number(payAmount) }),
    });
    setPayAmount("");
    load();
  }

  async function deleteInvoice() {
    if (!confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/admin/invoices");
    } catch {
      alert("Failed to delete invoice");
      setDeleting(false);
    }
  }

  function updateItem(i: number, key: string, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, lineItems: items }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update invoice");
        return;
      }
      setEditing(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  if (!invoice) return <p className="text-sm text-ink/70">Loading…</p>;

  const balance = invoice.total - invoice.paidAmount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/admin/invoices" className="text-sm text-ink/70 hover:text-ink">
          ← All invoices
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing((e) => !e)}
            className="rounded-full border border-ink/15 px-5 py-2 text-sm hover:border-ink/30"
          >
            Edit
          </button>
          <button
            disabled={deleting}
            onClick={deleteInvoice}
            className="rounded-full border border-clay/30 px-5 py-2 text-sm text-clay hover:bg-clay-light disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-full bg-forest px-5 py-2 text-sm text-cream hover:bg-forest-deep"
          >
            Print
          </button>
        </div>
      </div>

      {editing && (
        <Card className="print:hidden">
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="text-xs text-ink/60">Patient*</label>
              <select
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="mt-1 w-full max-w-sm rounded-lg border border-sand px-3 py-2 text-sm"
              >
                <option value="">— select —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-4 gap-2">
                  <input
                    placeholder="Description"
                    value={it.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    className="rounded-lg border border-sand px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={it.qty}
                    onChange={(e) => updateItem(i, "qty", e.target.value)}
                    className="rounded-lg border border-sand px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Unit price"
                    value={it.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                    className="rounded-lg border border-sand px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="GST %"
                    value={it.gstPercent}
                    onChange={(e) => updateItem(i, "gstPercent", e.target.value)}
                    className="rounded-lg border border-sand px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setItems((p) => [...p, { description: "", qty: "1", unitPrice: "0", gstPercent: "18" }])
                }
                className="text-xs text-forest hover:underline"
              >
                + Add line item
              </button>
            </div>
            <div className="flex gap-3">
              <button
                disabled={saving}
                className="rounded-lg bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg px-5 py-2 text-sm text-ink/60 hover:bg-sand/60"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="rounded-2xl border border-sand bg-white p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-data text-[10px] uppercase tracking-widest text-ink/65">
              Tax invoice
            </p>
            <p className="mt-1 font-display text-2xl">{invoice.number}</p>
            <p className="mt-1 text-sm text-ink/70">Issued {fmtDate(invoice.date)}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-display">{invoice.tenant.name}</p>
            <p className="text-ink/70">{invoice.tenant.address}</p>
            {invoice.tenant.gstNumber && (
              <p className="text-ink/70">GSTIN: {invoice.tenant.gstNumber}</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-start justify-between">
          <div>
            <p className="font-data text-[10px] uppercase tracking-widest text-ink/65">
              Billed to
            </p>
            <p className="mt-1 font-medium">{invoice.patient.name}</p>
            <p className="text-sm text-ink/70">{invoice.patient.phone}</p>
            <p className="text-sm text-ink/70">{invoice.patient.address}</p>
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
            <tr className="border-b border-sand text-left text-[10px] uppercase tracking-widest text-ink/65">
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
            <span className="text-ink/70">Subtotal</span>
            <span className="font-data">{inr(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/70">GST</span>
            <span className="font-data">{inr(invoice.gst)}</span>
          </div>
          <div className="flex justify-between border-t border-sand pt-1 font-medium">
            <span>Total</span>
            <span className="font-data text-lg">{inr(invoice.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/70">Paid</span>
            <span className="font-data">{inr(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Balance</span>
            <span className="font-data">{inr(balance)}</span>
          </div>
        </div>

        {invoice.payments.length > 0 && (
          <div className="mt-8">
            <p className="font-data text-[10px] uppercase tracking-widest text-ink/65">
              Payments received
            </p>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {invoice.payments.map((p: any) => (
                  <tr key={p.id} className="border-b border-sand/60">
                    <td className="py-2">{p.method}</td>
                    <td className="py-2 text-ink/70">{fmtDate(p.date)}</td>
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
