import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatBar } from "@/components/StatBar";
import { analyzeMeal } from "@/lib/analyze-meal.functions";
import {
  GOAL_LABELS,
  QUICK_MEALS,
  type FoodEntry,
  type Profile,
} from "@/lib/nutrition";

export function Dashboard({
  profile,
  entries,
  onAdd,
  onRemove,
  onReset,
}: {
  profile: Profile;
  entries: FoodEntry[];
  onAdd: (e: Omit<FoodEntry, "id" | "at">) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}) {
  const analyze = useServerFn(analyzeMeal);
  const fileRef = useRef<HTMLInputElement>(null);
  const [portion, setPortion] = useState(1);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [customProt, setCustomProt] = useState("");

  const consumed = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
    }),
    { calories: 0, protein: 0 },
  );

  const handleFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً (الحد ٨ ميغابايت)");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("فشل قراءة الصورة"));
      reader.readAsDataURL(file);
    });
    setImage(dataUrl);
    setBusy(true);
    try {
      const result = await analyze({ data: { imageDataUrl: dataUrl } });
      onAdd({
        label: `📸 ${result.name}`,
        calories: result.calories,
        protein: result.protein,
      });
      toast.success(
        `تم التحليل: ${result.calories} سعرة و${result.protein}غ بروتين`,
        { description: result.items.join("، ") || undefined },
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر تحليل الصورة");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-6">
      <div className="mx-auto w-full max-w-md space-y-5">
        <header className="bg-hero rounded-3xl p-5 text-primary-foreground shadow-card">
          <p className="text-sm opacity-90">أهلاً بك 👋</p>
          <h1 className="font-display text-2xl font-bold">{profile.name}</h1>
          <p className="mt-2 text-sm opacity-90">
            {GOAL_LABELS[profile.goal]} — {profile.targetCal} سعرة و{profile.targetProt}غ
            بروتين يومياً
          </p>
        </header>

        <div className="grid gap-3">
          <StatBar
            label="🔥 السعرات"
            value={consumed.calories}
            target={profile.targetCal}
            unit="سعرة"
            tone="calories"
          />
          <StatBar
            label="🥩 البروتين"
            value={consumed.protein}
            target={profile.targetProt}
            unit="غ"
            tone="protein"
          />
        </div>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">إضافة سريعة</h2>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setPortion((p) => Math.max(0.5, +(p - 0.5).toFixed(1)))}
                aria-label="تقليل الكمية"
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-16 text-center text-sm font-semibold">
                {portion} حصة
              </span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setPortion((p) => Math.min(5, +(p + 0.5).toFixed(1)))}
                aria-label="زيادة الكمية"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {QUICK_MEALS.map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={() => {
                  onAdd({
                    label: `${m.emoji} ${m.label}${portion !== 1 ? ` ×${portion}` : ""}`,
                    calories: Math.round(m.calories * portion),
                    protein: Math.round(m.protein * portion),
                  });
                  toast.success(`أُضيفت ${m.label}`);
                }}
                className="rounded-2xl border border-border bg-secondary p-3 text-right text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span className="block text-lg">{m.emoji}</span>
                {m.label}
                <span className="mt-1 block text-xs text-muted-foreground">
                  {Math.round(m.calories * portion)} سعرة ·{" "}
                  {Math.round(m.protein * portion)}غ
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold">📸 تحليل وجبة بالصورة (ذكاء اصطناعي)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            ارفع صورة وجبتك ليقدّر النظام السعرات والبروتين ويضيفها تلقائياً.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <Button
            type="button"
            className="mt-4 w-full"
            size="lg"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> جاري التحليل...
              </>
            ) : (
              <>
                <Camera className="size-4" /> اختر صورة الوجبة
              </>
            )}
          </Button>
          {image && (
            <img
              src={image}
              alt="صورة الوجبة التي تم تحليلها"
              className="mt-3 h-40 w-full rounded-2xl object-cover"
            />
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold">إضافة مخصصة</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="col-span-3 space-y-1">
              <Label htmlFor="cname">اسم الوجبة</Label>
              <Input
                id="cname"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="مثال: أرز ودجاج"
              />
            </div>
            <div className="col-span-1 space-y-1">
              <Label htmlFor="ccal">سعرات</Label>
              <Input
                id="ccal"
                type="number"
                value={customCal}
                onChange={(e) => setCustomCal(e.target.value)}
              />
            </div>
            <div className="col-span-1 space-y-1">
              <Label htmlFor="cprot">بروتين</Label>
              <Input
                id="cprot"
                type="number"
                value={customProt}
                onChange={(e) => setCustomProt(e.target.value)}
              />
            </div>
            <div className="col-span-1 flex items-end">
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  const cal = Number(customCal);
                  if (!customName.trim() || !cal) {
                    toast.error("أدخل الاسم والسعرات");
                    return;
                  }
                  onAdd({
                    label: customName.trim(),
                    calories: Math.round(cal),
                    protein: Math.round(Number(customProt) || 0),
                  });
                  setCustomName("");
                  setCustomCal("");
                  setCustomProt("");
                }}
              >
                أضف
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold">وجبات اليوم</h2>
          {entries.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              لم تسجّل أي وجبة بعد اليوم.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{e.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.calories} سعرة · {e.protein}غ بروتين
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemove(e.id)}
                    aria-label="حذف الوجبة"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Button variant="ghost" className="w-full" onClick={onReset}>
          <RotateCcw className="size-4" /> إعادة تعيين البيانات
        </Button>
      </div>
    </div>
  );
}
