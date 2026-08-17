import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  imageDataUrl: z.string().min(20),
  note: z.string().max(300).optional(),
});

export type MealAnalysis = {
  name: string;
  calories: number;
  protein: number;
  items: string[];
  confidence: "low" | "medium" | "high";
};

export const analyzeMeal = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<MealAnalysis> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI غير مفعّل حالياً");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content:
              "أنت خبير تغذية. حلل صورة الوجبة وقدّر السعرات الحرارية والبروتين للحصة الظاهرة. أعد JSON فقط بالشكل: {\"name\":string بالعربية,\"items\":string[] بالعربية,\"calories\":number,\"protein\":number,\"confidence\":\"low\"|\"medium\"|\"high\"} بدون أي نص إضافي.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: data.note?.trim()
                  ? `حلل هذه الوجبة. ملاحظة المستخدم: ${data.note}`
                  : "حلل هذه الوجبة وقدّر السعرات والبروتين.",
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("تم تجاوز الحد المسموح، حاول بعد قليل");
    if (res.status === 402) throw new Error("رصيد الذكاء الاصطناعي غير كافٍ");
    if (!res.ok) {
      console.error("AI gateway error", res.status, await res.text());
      throw new Error("تعذّر تحليل الصورة حالياً");
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("لم نتمكن من قراءة نتيجة التحليل");

    const parsed = JSON.parse(match[0]) as Partial<MealAnalysis>;
    return {
      name: parsed.name || "وجبة محللة بالصورة",
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
      items: Array.isArray(parsed.items) ? parsed.items.slice(0, 8).map(String) : [],
      confidence:
        parsed.confidence === "high" || parsed.confidence === "low"
          ? parsed.confidence
          : "medium",
    };
  });
