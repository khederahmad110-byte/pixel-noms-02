import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dashboard } from "@/components/Dashboard";
import { Onboarding } from "@/components/Onboarding";
import { MEAL_REMINDERS, announce } from "@/lib/notify";
import type { DayArchive } from "@/lib/history";
import {
  calcTargets,
  todayKey,
  type FoodEntry,
  type MealTemplate,
  type Profile,
  type WeightEntry,
} from "@/lib/nutrition";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رفيق التغذية الذكي — سعرات وماكروز وفيتامينات" },
      {
        name: "description",
        content:
          "تطبيق عربي لتتبع السعرات والبروتين والكربوهيدرات والدهون والفيتامينات والمعادن، مع تحليل الوجبات بالذكاء الاصطناعي وتذكير أسبوعي بالوزن.",
      },
      { property: "og:title", content: "رفيق التغذية الذكي 🥗" },
      {
        property: "og:description",
        content: "سعراتك وماكروزك وفيتاميناتك في مكان واحد، بتحليل ذكي للوجبات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "twitter:title", content: "رفيق التغذية الذكي 🥗" },
      {
        property: "twitter:description",
        content: "تتبع السعرات والماكروز والفيتامينات بالذكاء الاصطناعي.",
      },
    ],
  }),
  component: Index,
});

const PROFILE_KEY = "nutri.profile";
const LOG_KEY = "nutri.log";
const TPL_KEY = "nutri.templates";
const WEIGHT_KEY = "nutri.weights";
const ARCHIVE_KEY = "nutri.archive";
const REMINDER_KEY = "nutri.mealReminders";
const WEEK = 7 * 24 * 60 * 60 * 1000;

function Index() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [archive, setArchive] = useState<DayArchive>({});

  useEffect(() => {
    try {
      const p = localStorage.getItem(PROFILE_KEY);
      if (p) {
        const parsed = JSON.parse(p) as Profile;
        // ترقية الملفات القديمة: إعادة حساب أهداف الكارب والدهون إن كانت مفقودة
        if (!parsed.targetCarbs || !parsed.targetFats || !parsed.targetProt) {
          const t = calcTargets(parsed);
          parsed.targetCal = parsed.targetCal || t.targetCal;
          parsed.targetProt = parsed.targetProt || t.targetProt;
          parsed.targetCarbs = parsed.targetCarbs || t.targetCarbs;
          parsed.targetFats = parsed.targetFats || t.targetFats;
          localStorage.setItem(PROFILE_KEY, JSON.stringify(parsed));
        }
        setProfile(parsed);
      }
      const log = localStorage.getItem(LOG_KEY);
      if (log) {
        const parsed = JSON.parse(log) as { day: string; entries: FoodEntry[] };
        if (parsed.day === todayKey())
          setEntries(
            parsed.entries.map((e) => ({
              ...e,
              type: e.type ?? "سناك",
              calories: Number(e.calories) || 0,
              protein: Number(e.protein) || 0,
              carbs: Number(e.carbs) || 0,
              fats: Number(e.fats) || 0,
              micros: e.micros ?? {},
            })),
          );
      }
      const tpl = localStorage.getItem(TPL_KEY);
      if (tpl) setTemplates(JSON.parse(tpl) as MealTemplate[]);
      const w = localStorage.getItem(WEIGHT_KEY);
      if (w) setWeights(JSON.parse(w) as WeightEntry[]);
      const arc = localStorage.getItem(ARCHIVE_KEY);
      if (arc) setArchive(JSON.parse(arc) as DayArchive);
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  // حفظ سجل اليوم + أرشفته بشكل دائم ضمن السجل التاريخي
  useEffect(() => {
    if (!ready) return;
    const day = todayKey();
    localStorage.setItem(LOG_KEY, JSON.stringify({ day, entries }));
    setArchive((prev) => {
      const next: DayArchive = { ...prev };
      if (entries.length === 0) delete next[day];
      else next[day] = entries;
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(next));
      return next;
    });
  }, [entries, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(TPL_KEY, JSON.stringify(templates));
  }, [templates, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(WEIGHT_KEY, JSON.stringify(weights));
  }, [weights, ready]);

  // تنبيهات مواعيد الوجبات (مرة واحدة لكل موعد يومياً)
  useEffect(() => {
    if (!ready || !profile) return;
    const check = () => {
      const hour = new Date().getHours();
      const due = MEAL_REMINDERS.find((m) => m.hour === hour);
      if (!due) return;
      const stamp = `${todayKey()}-${due.hour}`;
      let sent: string[] = [];
      try {
        sent = JSON.parse(localStorage.getItem(REMINDER_KEY) ?? "[]") as string[];
      } catch {
        sent = [];
      }
      if (sent.includes(stamp)) return;
      localStorage.setItem(REMINDER_KEY, JSON.stringify([...sent.slice(-6), stamp]));
      announce("تذكير الوجبة", due.label);
    };
    check();
    const id = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [ready, profile]);

  const weighInDue = useMemo(() => {
    if (!profile) return false;
    const last = weights[0]?.at ?? 0;
    return Date.now() - last > WEEK;
  }, [weights, profile]);

  if (!ready) return <div className="min-h-screen bg-background" />;

  if (!profile) {
    return (
      <Onboarding
        onDone={(p) => {
          localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
          setProfile(p);
          setWeights([{ id: crypto.randomUUID(), weight: p.weight, at: Date.now() }]);
        }}
      />
    );
  }

  return (
    <Dashboard
      profile={profile}
      entries={entries}
      templates={templates}
      weights={weights}
      archive={archive}
      weighInDue={weighInDue}
      onAdd={(e) =>
        setEntries((prev) => [
          { ...e, id: crypto.randomUUID(), at: Date.now() },
          ...prev,
        ])
      }
      onRemove={(id) => setEntries((prev) => prev.filter((e) => e.id !== id))}
      onDeleteDay={(dayKey) => {
        setArchive((prev) => {
          const next = { ...prev };
          delete next[dayKey];
          localStorage.setItem(ARCHIVE_KEY, JSON.stringify(next));
          return next;
        });
        if (dayKey === todayKey()) setEntries([]);
        toast.success("تم حذف سجل اليوم");
      }}
      onDeleteMonth={(monthPrefix) => {
        setArchive((prev) => {
          const next: DayArchive = {};
          for (const [k, v] of Object.entries(prev))
            if (!k.startsWith(monthPrefix)) next[k] = v;
          localStorage.setItem(ARCHIVE_KEY, JSON.stringify(next));
          return next;
        });
        if (todayKey().startsWith(monthPrefix)) setEntries([]);
        toast.success("تم حذف سجل الشهر بالكامل");
      }}
      onSaveTemplate={(t) =>
        setTemplates((prev) => {
          const key = t.label.trim();
          if (!key) return prev;
          const existing = prev.find((x) => x.label.trim() === key);
          if (existing)
            return prev.map((x) =>
              x.id === existing.id ? { ...x, ...t, uses: x.uses + 1 } : x,
            );
          return [{ ...t, label: key, id: crypto.randomUUID(), uses: 0 }, ...prev].slice(
            0,
            30,
          );
        })
      }
      onDeleteTemplate={(id) => setTemplates((prev) => prev.filter((t) => t.id !== id))}
      onUpdateProfile={(p) => {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
        setProfile(p);
      }}
      onAddWeight={(weight) => {
        setWeights((prev) => [{ id: crypto.randomUUID(), weight, at: Date.now() }, ...prev]);
        setProfile((prev) => {
          if (!prev) return prev;
          const next = { ...prev, weight };
          localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
          return next;
        });
      }}
      onReset={() => {
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem(LOG_KEY);
        localStorage.removeItem(TPL_KEY);
        localStorage.removeItem(WEIGHT_KEY);
        localStorage.removeItem(ARCHIVE_KEY);
        setArchive({});
        setEntries([]);
        setTemplates([]);
        setWeights([]);
        setProfile(null);
      }}
    />
  );
}
