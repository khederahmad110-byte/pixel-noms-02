import type { MealAnalysis } from "@/routes/api/analyze-meal";

export type { MealAnalysis };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function analyzeMeal(input: {
  imageDataUrl?: string;
  text?: string;
}): Promise<MealAnalysis> {
  const res = await fetch(`${API_BASE}/api/analyze-meal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "تعذّر تحليل الوجبة");
  }
  return json as MealAnalysis;
}

