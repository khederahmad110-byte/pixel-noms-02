export function StatBar({
  label,
  value,
  target,
  unit,
  tone,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  tone: "calories" | "protein";
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const remaining = Math.max(0, target - value);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">
          <strong
            className={tone === "protein" ? "text-protein" : "text-primary"}
          >
            {Math.round(value)}
          </strong>{" "}
          / {target} {unit}
        </span>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            tone === "protein" ? "bg-protein" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {remaining > 0
          ? `متبقٍ ${Math.round(remaining)} ${unit} (${pct}%)`
          : `تم تحقيق الهدف 🎉 (${pct}%)`}
      </p>
    </div>
  );
}
