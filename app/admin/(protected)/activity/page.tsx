import Link from "next/link";
import { Card } from "@/components/Card";
import { getAuditLog } from "@/lib/queries/audit";

const ENTITY_FILTERS = ["Patient", "Invoice", "Payment", "Package"];

const ACTION_LABEL: Record<string, string> = {
  CREATE: "Added",
  UPDATE: "Edited",
  DELETE: "Deleted",
};

const ACTION_COLOR: Record<string, string> = {
  CREATE: "text-forest",
  UPDATE: "text-ink/70",
  DELETE: "text-clay",
};

function entityHref(entity: string, entityId: string): string | null {
  if (entity === "Patient") return `/admin/patients/${entityId}`;
  if (entity === "Invoice") return `/admin/invoices/${entityId}`;
  return null;
}

function summarizeDiff(action: string, diff: unknown): string {
  if (!diff || typeof diff !== "object") return "";
  const d = diff as Record<string, unknown>;
  if (action === "UPDATE" && "before" in d && "after" in d) {
    const before = d.before as Record<string, unknown>;
    const after = d.after as Record<string, unknown>;
    const changed = Object.keys(after).filter(
      (k) => JSON.stringify(before?.[k]) !== JSON.stringify(after[k])
    );
    if (changed.length === 0) return "";
    return `Changed ${changed.join(", ")}`;
  }
  if (action === "UPDATE" && Array.isArray(d.changedFields)) {
    const identifying = Object.entries(d)
      .filter(([k, v]) => k !== "changedFields" && v !== null && v !== undefined && typeof v !== "object")
      .map(([k, v]) => `${k}: ${v}`);
    const fields = d.changedFields as unknown[];
    const changedLabel = fields.length > 0 ? `Changed ${fields.join(", ")}` : "";
    return [...identifying, changedLabel].filter(Boolean).join(" · ");
  }
  const parts = Object.entries(d)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
    .map(([k, v]) => `${k}: ${v}`);
  return parts.join(" · ");
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>;
}) {
  const { entity } = await searchParams;
  const logs = await getAuditLog(entity);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Activity Log</h1>
        <p className="mt-1 text-sm text-ink/60">
          Who added, edited, or deleted what — most recent {logs.length} events.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/activity"
          className={`rounded-full px-4 py-1.5 ${!entity ? "bg-forest text-cream" : "bg-sand/60 text-ink/70 hover:bg-sand"}`}
        >
          All
        </Link>
        {ENTITY_FILTERS.map((e) => (
          <Link
            key={e}
            href={`/admin/activity?entity=${e}`}
            className={`rounded-full px-4 py-1.5 ${entity === e ? "bg-forest text-cream" : "bg-sand/60 text-ink/70 hover:bg-sand"}`}
          >
            {e}
          </Link>
        ))}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand text-left text-[10px] uppercase tracking-widest text-ink/65">
              <th className="px-6 py-3">When</th>
              <th className="px-6 py-3">Who</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Entity</th>
              <th className="px-6 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-ink/60">
                  No activity recorded yet.
                </td>
              </tr>
            )}
            {logs.map((log) => {
              const href = entityHref(log.entity, log.entityId);
              return (
                <tr key={log.id} className="border-b border-sand/60 last:border-0 hover:bg-sand/20">
                  <td className="whitespace-nowrap px-6 py-3 text-ink/70">
                    {new Date(log.timestamp).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-3">{log.actor?.name ?? "System"}</td>
                  <td className={`px-6 py-3 font-medium ${ACTION_COLOR[log.action] ?? ""}`}>
                    {ACTION_LABEL[log.action] ?? log.action}
                  </td>
                  <td className="px-6 py-3">
                    {href ? (
                      <Link href={href} className="hover:text-forest">
                        {log.entity}
                      </Link>
                    ) : (
                      log.entity
                    )}
                  </td>
                  <td className="px-6 py-3 text-ink/70">{summarizeDiff(log.action, log.diff)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
