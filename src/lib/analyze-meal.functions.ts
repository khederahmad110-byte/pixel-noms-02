import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MICRO_KEYS, type MicroAmounts } from "@/lib/micronutrients";

const inputSchema = z
  .object({
    imageDataUrl: z.string().min(20).optional(),
    text: z.string().min(2).max(400).optional(),
  })
  .refine((v) => Boolean(v.imageDataUrl || v.text), {
    message: "أدخل مكونات الوجبة أو ارفع صورة",
  });

export type MealAnalysis = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  items: string[];
  micros: MicroAmounts;
  confidence: "low" | "medium" | "high";
};

const SYSTEM_PROMPT =
  'أنت خبير تغذية. حلل الوجبة (صورة أو وصف نصي بمكونات متعددة) وقدّر إجمالي السعرات والبروتين والكربوهيدرات والدهون والمغذيات الدقيقة للحصة الظاهرة/المذكورة. أعد JSON فقط بالشكل: {"name":string بالعربية,"items":string[] بالعربية لكل مكوّن,"calories":number,"protein":number,"carbs":number,"fats":number,"micros":{"vitaminA":مكغ,"vitaminC":ملغ,"vitaminD":مكغ,"vitaminE":ملغ,"vitaminB12":مكغ,"folate":مكغ,"iron":ملغ,"calcium":ملغ,"magnesium":ملغ,"zinc":ملغ,"potassium":ملغ},"confidence":"low"|"medium"|"high"} كل قيم micros أرقام تقديرية (0 إن كانت مهملة) بدون أي نص إضافي.';

export const analyzeMeal = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<MealAnalysis> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI غير مفعّل حالياً");

    const content: Record<string, unknown>[] = [
      {
        type: "text",
        text: data.text?.trim()
          ? `حلل هذه الوجبة المكوّنة من: ${data.text.trim()}`
          : "حلل هذه الوجبة من الصورة وقدّر قيمها الغذائية.",
      },
    ];
    if (data.imageDataUrl) {
      content.push({ type: "image_url", image_url: { url: data.imageDataUrl } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
      }),
    });

    if (res.status === 429) throw new Error("تم تجاوز الحد المسموح، حاول بعد قليل");
    if (res.status === 402) throw new Error("رصيد الذكاء الاصطناعي غير كافٍ");
    if (!res.ok) {
      console.error("AI gateway error", res.status, await res.text());
      throw new Error("تعذّر تحليل الوجبة حالياً");
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("لم نتمكن من قراءة نتيجة التحليل");

    const parsed = JSON.parse(match[0]) as Partial<MealAnalysis>;
    const num = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
    return {
      name: parsed.name || data.text?.trim() || "وجبة محللة بالصورة",
      calories: num(parsed.calories),
      protein: num(parsed.protein),
      carbs: num(parsed.carbs),
      fats: num(parsed.fats),
      items: Array.isArray(parsed.items) ? parsed.items.slice(0, 10).map(String) : [],
      confidence:
        parsed.confidence === "high" || parsed.confidence === "low"
          ? parsed.confidence
          : "medium",
    };
  });
