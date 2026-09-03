import type { FoodEntry } from "@/lib/nutrition";

/** أرشيف يومي: مفتاح اليوم (YYYY-MM-DD) → وجبات ذلك اليوم. */
export type DayArchive = Record<string, FoodEntry[]>;

export type DayTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export const EMPTY_TOTALS: DayTotals = { calories: 0, protein: 0, carbs: 0, fats: 0 };

export function sumEntries(entries: FoodEntry[]): DayTotals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (Number(e.calories) || 0),
      protein: acc.protein + (Number(e.protein) || 0),
      carbs: acc.carbs + (Number(e.carbs) || 0),
      fats: acc.fats + (Number(e.fats) || 0),
    }),
    { ...EMPTY_TOTALS },
  );
}

export function sumTotals(list: DayTotals[]): DayTotals {
  return list.reduce(
    (acc, t) => ({
      calories: acc.calories + t.calories,
      protein: acc.protein + t.protein,
      carbs: acc.carbs + t.carbs,
      fats: acc.fats + t.fats,
    }),
    { ...EMPTY_TOTALS },
  );
}

export function dayKeyOf(d: Date) {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** كل أيام الشهر المعروض مرتبة، مع مصفوفة فارغة لأيام ما قبل بداية الشهر. */
export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // الأسبوع يبدأ السبت في التقويم العربي
  const lead = (first.getDay() + 1) % 7;
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

export const WEEKDAY_LABELS = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];

export const MONTH_LABELS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];
