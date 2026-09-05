import { useMemo, useState } from "react";
import { BellRing, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  MICRO_INFO,
  MICRO_KEYS,
  calcDRI,
  sumMicros,
  type MicroKey,
} from "@/lib/micronutrients";
import { announce, speak } from "@/lib/notify";
import type { FoodEntry, Profile } from "@/lib/nutrition";

export function MicroTracker({
  profile,
  entries,
}: {
  profile: Profile;
  entries: FoodEntry[];
}) {
  const [open, setOpen] = useState<MicroKey | null>(null);
  const dri = useMemo(
    () => calcDRI({ gender: profile.gender, age: profile.age }),
    [profile.gender, profile.age],
  );
  const consumed = useMemo(
    () => sumMicros(entries.map((e) => e.micros ?? {})),
    [entries],
  );

  const rows = MICRO_KEYS.map((k) => {
    const value = consumed[k] ?? 0;
    const target = dri[k];
    return { k, value, target, pct: Math.min(100, Math.round((value / target) * 100)) };
  });

  const deficits = rows.filter((r) => r.pct < 70);

  const alertDeficiency = () => {
    if (deficits.length === 0) {
      announce("تغطية ممتازة ✅", "غطّيت احتياجك من الفيتامينات والمعادن اليوم.");
      toast.success("لا يوجد نقص واضح اليوم 🎉");
      return;
    }
    const names = deficits.slice(0, 4).map((d) => MICRO_INFO[d.k].label);
    announce(
      "تنبيه نقص غذائي",
      `لديك نقص في: ${names.join("، ")}. أضف مصادر طبيعية مثل ${deficits
        .slice(0, 3)
        .map((d) => MICRO_INFO[d.k].sources[0])
        .join("، ")}.`,
    );
    toast.warning(`نقص في ${deficits.length} عنصر غذائي`, {
      description: names.join("، "),
    });
  };

  return (
    <div className="space-y-5 text-right">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-semibold">💊 تغطية الفيتامينات والمعادن اليوم</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          الحاجة اليومية (DRI) محسوبة حسب جنسك ({profile.gender === "male" ? "ذكر" : "أنثى"})
          وعمرك ({profile.age} سنة). اضغط أي عنصر لرؤية فائدته ومصادره.
        </p>
        <Button className="mt-3 w-full" onClick={alertDeficiency}>
          <BellRing className="size-4" /> التنبيه الذكي للنقص
        </Button>
      </section>

      <div className="grid gap-3">
        {rows.map((r) => {
          const info = MICRO_INFO[r.k];
          const isOpen = open === r.k;
          return (
            <div
              key={r.k}
              className="rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <button
                type="button"
                className="w-full text-right"
                onClick={() => setOpen(isOpen ? null : r.k)}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold">
                    {info.emoji} {info.label}
                  </span>
                  <span className="num text-xs text-muted-foreground">
                    <strong className={r.pct < 70 ? "text-destructive" : "text-success"}>
                      {Math.round(r.value * 10) / 10}
                    </strong>{" "}
                    / {r.target} {info.unit}
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      r.pct < 70 ? "bg-fats" : "bg-success"
                    }`}
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </button>
              {isOpen && (
                <div className="mt-3 space-y-2 rounded-xl bg-secondary p-3 text-xs text-secondary-foreground">
                  <p>
                    <strong>الفائدة:</strong> {info.benefit}
                  </p>
                  <p>
                    <strong>المصادر الطبيعية:</strong> {info.sources.join("، ")}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      speak(
                        `${info.label}. ${info.benefit} مصادره: ${info.sources.join("، ")}`,
                      )
                    }
                  >
                    <Volume2 className="size-4" /> استمع
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
