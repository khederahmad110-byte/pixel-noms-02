import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MONTH_LABELS,
  WEEKDAY_LABELS,
  dayKeyOf,
  monthGrid,
  sumEntries,
  sumTotals,
  type DayArchive,
  type DayTotals,
} from "@/lib/history";
import type { Profile } from "@/lib/nutrition";

function TotalsCard({
  title,
  subtitle,
  totals,
  days,
}: {
  title: string;
  subtitle?: string;
  totals: DayTotals;
  days?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary p-3">
      <p className="text-sm font-semibold text-secondary-foreground">{title}</p>
      {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      <p className="mt-1 text-xs text-secondary-foreground/80">
        🔥 {Math.round(totals.calories)} · 🥩 {Math.round(totals.protein)}غ · 🍞{" "}
        {Math.round(totals.carbs)}غ · 🥑 {Math.round(totals.fats)}غ
      </p>
      {days && days > 0 ? (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          متوسط يومي: {Math.round(totals.calories / days)} سعرة على {days} يوم مسجّل
        </p>
      ) : null}
    </div>
  );
}

export function HistoryView({
  archive,
  profile,
  onDeleteDay,
  onDeleteMonth,
}: {
  archive: DayArchive;
  profile: Profile;
  onDeleteDay: (dayKey: string) => void;
  onDeleteMonth: (monthPrefix: string) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selected, setSelected] = useState<string>(dayKeyOf(today));

  const cells = useMemo(
    () => monthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const totalsByDay = useMemo(() => {
    const map: Record<string, DayTotals> = {};
    for (const [key, entries] of Object.entries(archive)) {
      map[key] = sumEntries(entries);
    }
    return map;
  }, [archive]);

  const monthKeys = useMemo(
    () =>
      cells
        .filter((c): c is Date => Boolean(c))
        .map(dayKeyOf)
        .filter((k) => totalsByDay[k]),
    [cells, totalsByDay],
  );

  const monthTotals = sumTotals(monthKeys.map((k) => totalsByDay[k]!));

  const weekTotals = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    const keys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const k = dayKeyOf(d);
      if (totalsByDay[k]) keys.push(k);
    }
    return { totals: sumTotals(keys.map((k) => totalsByDay[k]!)), days: keys.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalsByDay]);

  const selectedEntries = archive[selected] ?? [];
  const selectedTotals = sumEntries(selectedEntries);

  const monthPrefix = `${cursor.getFullYear()}-${`${cursor.getMonth() + 1}`.padStart(2, "0")}`;
  const todayKeyStr = dayKeyOf(today);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <Button
            size="icon"
            variant="outline"
            aria-label="الشهر السابق"
            onClick={() =>
              setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))
            }
          >
            <ChevronRight className="size-4" />
          </Button>
          <h2 className="font-semibold">
            {MONTH_LABELS[cursor.getMonth()]} {cursor.getFullYear()}
          </h2>
          <Button
            size="icon"
            variant="outline"
            aria-label="الشهر التالي"
            onClick={() =>
              setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))
            }
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
          {WEEKDAY_LABELS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={`e${i}`} />;
            const key = dayKeyOf(d);
            const t = totalsByDay[key];
            const ratio = t ? t.calories / Math.max(1, profile.targetCal) : 0;
            const isSelected = key === selected;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={`rounded-xl border p-1 text-center transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : t
                      ? "border-border bg-secondary text-secondary-foreground hover:bg-accent"
                      : "border-border/50 bg-card text-muted-foreground"
                }`}
              >
                <span className="block text-xs font-semibold">{d.getDate()}</span>
                <span className="block text-[9px]">
                  {t ? Math.round(t.calories) : "—"}
                </span>
                <span
                  className={`mx-auto mt-0.5 block h-1 w-4 rounded-full ${
                    !t
                      ? "bg-transparent"
                      : ratio > 1.1
                        ? "bg-fats"
                        : ratio >= 0.8
                          ? "bg-success"
                          : "bg-carbs"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-semibold">📊 التجميع</h2>
        <div className="mt-3 grid gap-2">
          <TotalsCard
            title="آخر ٧ أيام"
            totals={weekTotals.totals}
            days={weekTotals.days}
          />
          <TotalsCard
            title={`شهر ${MONTH_LABELS[cursor.getMonth()]}`}
            totals={monthTotals}
            days={monthKeys.length}
          />
        </div>
        <div className="mt-3 grid gap-2 border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2 text-destructive hover:bg-destructive/10"
            disabled={!totalsByDay[selected]}
            onClick={() => {
              if (window.confirm(`حذف سجل يوم ${selected} نهائياً؟`))
                onDeleteDay(selected);
            }}
          >
            <Trash2 className="size-4" />
            حذف سجل اليوم المحدد ({new Date(`${selected}T00:00:00`).toLocaleDateString("ar-EG")})
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2 text-destructive hover:bg-destructive/10"
            disabled={monthKeys.length === 0}
            onClick={() => {
              if (
                window.confirm(
                  `حذف جميع سجلات شهر ${MONTH_LABELS[cursor.getMonth()]} ${cursor.getFullYear()} (${monthKeys.length} يوم) نهائياً؟`,
                )
              )
                onDeleteMonth(monthPrefix);
            }}
          >
            <Trash2 className="size-4" />
            حذف سجل شهر {MONTH_LABELS[cursor.getMonth()]} بالكامل
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-semibold">
          سجل يوم {new Date(`${selected}T00:00:00`).toLocaleDateString("ar-EG")}
        </h2>
        {selectedEntries.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">لا توجد وجبات مسجّلة بهذا اليوم.</p>
        ) : (
          <>
            <p className="mt-1 text-xs text-muted-foreground">
              🔥 {Math.round(selectedTotals.calories)} · 🥩{" "}
              {Math.round(selectedTotals.protein)}غ · 🍞 {Math.round(selectedTotals.carbs)}غ
              · 🥑 {Math.round(selectedTotals.fats)}غ
            </p>
            <ul className="mt-3 divide-y divide-border">
              {selectedEntries.map((e) => (
                <li key={e.id} className="py-2">
                  <p className="text-sm font-medium">
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                      {e.type}
                    </span>
                    {e.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    🔥 {e.calories} · 🥩 {e.protein}غ · 🍞 {e.carbs}غ · 🥑 {e.fats}غ
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
