import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-sand bg-white/60 p-6 ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: { value: string; isPositive: boolean };
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">{label}</p>
        {trend && (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {trend.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink/50">{sub}</p>}
    </Card>
  );
}
