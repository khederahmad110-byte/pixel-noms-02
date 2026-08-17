export type Gender = "male" | "female";
export type Goal = "gain" | "lose" | "maintain";
export type Activity = "sedentary" | "light" | "moderate" | "high" | "athlete";
export type MealType = "فطور" | "غداء" | "عشاء" | "سناك";

export const MEAL_TYPES: MealType[] = ["فطور", "غداء", "عشاء", "سناك"];

export type Profile = {
  name: string;
  age: number;
  height: number;
  weight: number;
  gender: Gender;
  activity: Activity;
  goal: Goal;
  targetCal: number;
  targetProt: number;
  targetCarbs: number;
  targetFats: number;
};

export type FoodEntry = {
  id: string;
  label: string;
  type: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  at: number;
};

export const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
};

export const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary: "خامل (عمل مكتبي)",
  light: "نشاط خفيف (1-2 يوم)",
  moderate: "نشاط متوسط (3-4 أيام)",
  high: "نشاط عالٍ (5-6 أيام)",
  athlete: "رياضي محترف (يومياً)",
};

export const GOAL_LABELS: Record<Goal, string> = {
  gain: "زيادة الوزن وتضخيم 📈",
  lose: "خسارة وزن وتنشيف 📉",
  maintain: "الحفاظ على الوزن ⚖️",
};

export function calcTargets(input: {
  age: number;
  height: number;
  weight: number;
  gender: Gender;
  activity: Activity;
  goal: Goal;
}) {
  // Mifflin-St Jeor
  const bmr =
    10 * input.weight +
    6.25 * input.height -
    5 * input.age +
    (input.gender === "male" ? 5 : -161);
  const tdee = bmr * ACTIVITY_FACTORS[input.activity];
  const targetCal = Math.round(
    input.goal === "gain" ? tdee + 400 : input.goal === "lose" ? tdee - 500 : tdee,
  );
  const protPerKg = input.goal === "gain" ? 1.8 : input.goal === "lose" ? 2.0 : 1.6;
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCal,
    targetProt: Math.round(input.weight * protPerKg),
    targetCarbs: Math.round((targetCal * 0.45) / 4),
    targetFats: Math.round((targetCal * 0.25) / 9),
  };
}

export const QUICK_MEALS = [
  {
    label: "سموذي الصباح",
    emoji: "🥤",
    calories: 500,
    protein: 25,
    carbs: 65,
    fats: 14,
  },
  {
    label: "سندويش فلافل",
    emoji: "🥪",
    calories: 450,
    protein: 15,
    carbs: 55,
    fats: 18,
  },
  {
    label: "وجبة العشاء الرئيسية",
    emoji: "🍲",
    calories: 650,
    protein: 45,
    carbs: 60,
    fats: 22,
  },
  { label: "مكسرات وسناك", emoji: "🥜", calories: 200, protein: 5, carbs: 8, fats: 18 },
  {
    label: "صدر دجاج مشوي",
    emoji: "🍗",
    calories: 280,
    protein: 46,
    carbs: 0,
    fats: 10,
  },
  {
    label: "بيض مسلوق (٢ حبة)",
    emoji: "🥚",
    calories: 150,
    protein: 13,
    carbs: 1,
    fats: 11,
  },
];

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
