import type { Gender } from "@/lib/nutrition";

export type MicroKey =
  | "vitaminA"
  | "vitaminC"
  | "vitaminD"
  | "vitaminE"
  | "vitaminB12"
  | "folate"
  | "iron"
  | "calcium"
  | "magnesium"
  | "zinc"
  | "potassium";

export const MICRO_KEYS: MicroKey[] = [
  "vitaminA",
  "vitaminC",
  "vitaminD",
  "vitaminE",
  "vitaminB12",
  "folate",
  "iron",
  "calcium",
  "magnesium",
  "zinc",
  "potassium",
];

export type MicroInfo = {
  label: string;
  emoji: string;
  unit: string;
  benefit: string;
  sources: string[];
};

export const MICRO_INFO: Record<MicroKey, MicroInfo> = {
  vitaminA: {
    label: "فيتامين A",
    emoji: "🥕",
    unit: "مكغ",
    benefit: "صحة النظر والجلد ودعم المناعة.",
    sources: ["الجزر", "البطاطا الحلوة", "الكبد", "السبانخ", "المشمش المجفف"],
  },
  vitaminC: {
    label: "فيتامين C",
    emoji: "🍊",
    unit: "ملغ",
    benefit: "مضاد أكسدة، يعزز المناعة وامتصاص الحديد.",
    sources: ["البرتقال", "الفليفلة الحمراء", "الكيوي", "الفراولة", "البروكلي"],
  },
  vitaminD: {
    label: "فيتامين D",
    emoji: "☀️",
    unit: "مكغ",
    benefit: "امتصاص الكالسيوم وقوة العظام والمزاج.",
    sources: ["السلمون", "السردين", "صفار البيض", "الحليب المدعّم", "التعرض للشمس"],
  },
  vitaminE: {
    label: "فيتامين E",
    emoji: "🌰",
    unit: "ملغ",
    benefit: "حماية الخلايا من الأكسدة وصحة البشرة.",
    sources: ["اللوز", "بذور دوار الشمس", "زيت الزيتون", "الأفوكادو"],
  },
  vitaminB12: {
    label: "فيتامين B12",
    emoji: "🥩",
    unit: "مكغ",
    benefit: "تكوين كريات الدم الحمراء وصحة الأعصاب.",
    sources: ["اللحم الأحمر", "الأسماك", "البيض", "الألبان", "الكبد"],
  },
  folate: {
    label: "حمض الفوليك",
    emoji: "🥬",
    unit: "مكغ",
    benefit: "انقسام الخلايا وتكوين الحمض النووي.",
    sources: ["السبانخ", "العدس", "الحمص", "الأفوكادو", "البروكلي"],
  },
  iron: {
    label: "الحديد",
    emoji: "🩸",
    unit: "ملغ",
    benefit: "نقل الأكسجين في الدم ومقاومة التعب.",
    sources: ["الكبد", "اللحم الأحمر", "العدس", "السبانخ", "الفاصولياء"],
  },
  calcium: {
    label: "الكالسيوم",
    emoji: "🦴",
    unit: "ملغ",
    benefit: "بناء العظام والأسنان وانقباض العضلات.",
    sources: ["الحليب", "اللبن", "الجبنة", "الطحينة", "السردين"],
  },
  magnesium: {
    label: "المغنيسيوم",
    emoji: "🌿",
    unit: "ملغ",
    benefit: "استرخاء العضلات وإنتاج الطاقة وجودة النوم.",
    sources: ["المكسرات", "الشوكولا الداكنة", "الشوفان", "الموز", "البقوليات"],
  },
  zinc: {
    label: "الزنك",
    emoji: "🦪",
    unit: "ملغ",
    benefit: "المناعة والتئام الجروح وهرمونات النمو.",
    sources: ["اللحم", "بذور اليقطين", "الحمص", "البيض", "المحار"],
  },
  potassium: {
    label: "البوتاسيوم",
    emoji: "🍌",
    unit: "ملغ",
    benefit: "توازن السوائل وضغط الدم ووظيفة العضلات.",
    sources: ["الموز", "البطاطا", "الأفوكادو", "التمر", "الطماطم"],
  },
};

export type MicroAmounts = Partial<Record<MicroKey, number>>;

/** الحاجة اليومية الموصى بها (DRI) بحسب الجنس والعمر. */
export function calcDRI(input: { gender: Gender; age: number }): Record<MicroKey, number> {
  const male = input.gender === "male";
  const older = input.age >= 51;
  return {
    vitaminA: male ? 900 : 700,
    vitaminC: male ? 90 : 75,
    vitaminD: input.age >= 71 ? 20 : 15,
    vitaminE: 15,
    vitaminB12: 2.4,
    folate: 400,
    iron: male ? 8 : input.age >= 51 ? 8 : 18,
    calcium: older || (!male && input.age >= 51) ? 1200 : 1000,
    magnesium: male ? 420 : 320,
    zinc: male ? 11 : 8,
    potassium: male ? 3400 : 2600,
  };
}

export function sumMicros(list: MicroAmounts[]): MicroAmounts {
  const out: MicroAmounts = {};
  for (const m of list) {
    for (const k of MICRO_KEYS) {
      const v = Number(m?.[k] ?? 0);
      if (v > 0) out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}
