"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";

type Invoice = {
  id: string;
  number: string;
  date: string;
  patient: { id: string; name: string };
  subtotal: number;
  gst: number;
  total: number;
  balance: number;
  status: string;
};

type LineItemForm = { description: string; qty: string; unitPrice: string; gstPercent: string };

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function InvoicesClient({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [items, setItems] = useState<LineItemForm[]>([
    { description: "Consultation", qty: "1", unitPrice: "800", gstPercent: "18" },
  ]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/invoices/");
    const data = await res.json();
    setInvoices(data.invoices);
  }, []);

  useEffect(() => {
    fetch("/api/patients/")
      .then((r) => r.json())
      .then((d) => setPatients(d.patients));
  }, []);

  function updateItem(i: number, key: keyof LineItemForm, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/invoices/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, lineItems: items }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create invoice");
        return;
      }
      
      setShowForm(false);
      setItems([{ description: "Consultation", qty: "1", unitPrice: "800", gstPercent: "18" }]);
      setPatientId("");
      setPatientId("");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`/api/invoices/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      load();
    } catch {
      alert("Failed to delete invoice");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Billing &amp; GST Invoices</h1>
          <p className="mt-1 text-sm text-ink/60">{invoices?.length ?? 0} invoices</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep"
        >
          + New Invoice
        </button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-4">
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
                {saving ? "Creating…" : "Create invoice"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-5 py-2 text-sm text-ink/60 hover:bg-sand/60"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand text-left text-[10px] uppercase tracking-widest text-ink/40">
              <th className="px-6 py-3">Invoice #</th>
              <th className="px-6 py-3">Patient</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Subtotal</th>
              <th className="px-6 py-3">GST</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Balance</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices?.map((inv) => (
              <tr key={inv.id} className="border-b border-sand/60 last:border-0 hover:bg-sand/20">
                <td className="px-6 py-3">
                  <Link href={`/admin/invoices/${inv.id}`} className="font-data hover:text-forest">
                    {inv.number}
                  </Link>
                </td>
                <td className="px-6 py-3">{inv.patient.name}</td>
                <td className="px-6 py-3 text-ink/70">{fmtDate(inv.date)}</td>
                <td className="px-6 py-3 font-data">{inr(inv.subtotal)}</td>
                <td className="px-6 py-3 font-data">{inr(inv.gst)}</td>
                <td className="px-6 py-3 font-data font-medium">{inr(inv.total)}</td>
                <td className="px-6 py-3 font-data">{inv.balance > 0 ? inr(inv.balance) : "₹0"}</td>
                <td className="px-6 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      inv.status === "PAID"
                        ? "bg-forest/10 text-forest"
                        : inv.status === "PARTIAL"
                        ? "bg-clay-light text-clay"
                        : "bg-sand text-ink/60"
                    }`}
                  >
                    {inv.status.toLowerCase()}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-3 text-xs font-medium">
                    <Link href={`/admin/invoices/${inv.id}`} className="text-ink/50 hover:text-ink">
                      View
                    </Link>
                    <Link href={`/admin/invoices/${inv.id}?edit=true`} className="text-ink/50 hover:text-ink">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(inv.id)} className="text-clay/70 hover:text-clay">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
