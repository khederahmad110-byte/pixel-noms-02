const TONES = {
  calories: { text: "text-primary", bg: "bg-primary" },
  protein: { text: "text-protein", bg: "bg-protein" },
  carbs: { text: "text-carbs", bg: "bg-carbs" },
  fats: { text: "text-fats", bg: "bg-fats" },
} as const;

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
  tone: keyof typeof TONES;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const remaining = Math.max(0, target - value);
  const t = TONES[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-right shadow-card">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="num text-sm text-muted-foreground">
          <strong className={t.text}>{Math.round(value)}</strong> / {target} {unit}
        </span>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${t.bg}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {remaining > 0 ? (
          <>
            متبقٍ <span className="num">{`${Math.round(remaining)} ${unit} (${pct}%)`}</span>
          </>
        ) : (
          <>
            تم تحقيق الهدف 🎉 <span className="num">{`(${pct}%)`}</span>
          </>
        )}
      </p>
    </div>
  );
}
