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
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <p className="font-data text-[10px] uppercase tracking-widest text-ink/40">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink/50">{sub}</p>}
    </Card>
  );
}
