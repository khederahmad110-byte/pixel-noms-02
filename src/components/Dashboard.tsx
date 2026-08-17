import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Camera, Loader2, Minus, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatBar } from "@/components/StatBar";
import { analyzeMeal, type MealAnalysis } from "@/lib/analyze-meal.functions";
import {
  GOAL_LABELS,
  MEAL_TYPES,
  QUICK_MEALS,
  type FoodEntry,
  type MealType,
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
  const [mealType, setMealType] = useState<MealType>("فطور");
  const [portion, setPortion] = useState(1);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [customProt, setCustomProt] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFats, setCustomFats] = useState("");

  const consumed = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fats: acc.fats + e.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );

  const pushResult = (result: MealAnalysis, prefix: string) => {
    onAdd({
      label: `${prefix} ${result.name}`,
      type: mealType,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fats: result.fats,
    });
    toast.success(
      `تم التحليل: ${result.calories} سعرة · ${result.protein}غ بروتين · ${result.carbs}غ كارب · ${result.fats}غ دهون`,
      { description: result.items.join("، ") || undefined },
    );
  };

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
      pushResult(result, "📸");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر تحليل الصورة");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleText = async () => {
    const text = textInput.trim();
    if (text.length < 2) {
      toast.error("اكتب مكونات الوجبة أولاً");
      return;
    }
    setBusy(true);
    try {
      const result = await analyze({ data: { text } });
      pushResult(result, "🔍");
      setTextInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر تحليل الوجبة");
    } finally {
      setBusy(false);
    }
  };

  const lowIntake = consumed.calories < profile.targetCal * 0.5;
  const overCal = consumed.calories > profile.targetCal * 1.1;

  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-6">
      <div className="mx-auto w-full max-w-md space-y-5">
        <header className="bg-hero rounded-3xl p-5 text-primary-foreground shadow-card">
          <p className="text-sm opacity-90">أهلاً بك 👋</p>
          <h1 className="font-display text-2xl font-bold">{profile.name}</h1>
          <p className="mt-2 text-sm opacity-90">
            {GOAL_LABELS[profile.goal]} — {profile.targetCal} سعرة · {profile.targetProt}غ
            بروتين · {profile.targetCarbs}غ كارب · {profile.targetFats}غ دهون
          </p>
        </header>

        {lowIntake && (
          <div className="flex items-start gap-2 rounded-2xl border border-accent bg-accent/20 p-3 text-xs text-accent-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              تنبيه: سعراتك اليومية منخفضة ولم تصل للحد المطلوب، تأكد من تناول وجباتك
              لدعم مجهودك!
            </span>
          </div>
        )}
        {overCal && (
          <div className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>تجاوزت هدف السعرات اليومي، خفّف الوجبات القادمة ⚖️</span>
          </div>
        )}

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
          <StatBar
            label="🍞 الكربوهيدرات"
            value={consumed.carbs}
            target={profile.targetCarbs}
            unit="غ"
            tone="carbs"
          />
          <StatBar
            label="🥑 الدهون"
            value={consumed.fats}
            target={profile.targetFats}
            unit="غ"
            tone="fats"
          />
        </div>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold">نوع الوجبة</h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {MEAL_TYPES.map((t) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={mealType === t ? "default" : "outline"}
                onClick={() => setMealType(t)}
              >
                {t}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            كل ما تضيفه سيُسجَّل تحت وجبة «{mealType}».
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold">🔍 تحليل نصي للمكونات (ذكاء اصطناعي)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            اكتب مكونات الوجبة وسيحسب النظام السعرات والماكروز تلقائياً.
          </p>
          <Input
            className="mt-3"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="مثال: بيض، جبنة، زيتون، رغيف خبز"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleText();
            }}
          />
          <Button
            type="button"
            className="mt-3 w-full"
            disabled={busy}
            onClick={() => void handleText()}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> جاري تحليل المكونات...
              </>
            ) : (
              <>
                <Search className="size-4" /> تحليل وإضافة للمجموع
              </>
            )}
          </Button>
        </section>

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
                    type: mealType,
                    calories: Math.round(m.calories * portion),
                    protein: Math.round(m.protein * portion),
                    carbs: Math.round(m.carbs * portion),
                    fats: Math.round(m.fats * portion),
                  });
                  toast.success(`أُضيفت ${m.label}`);
                }}
                className="rounded-2xl border border-border bg-secondary p-3 text-right text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span className="block text-lg">{m.emoji}</span>
                {m.label}
                <span className="mt-1 block text-xs text-muted-foreground">
                  {Math.round(m.calories * portion)} سعرة ·{" "}
                  {Math.round(m.protein * portion)}غ بروتين
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold">📸 تحليل وجبة بالصورة (ذكاء اصطناعي)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            ارفع صورة وجبتك ليقدّر النظام السعرات والماكروز ويضيفها تلقائياً.
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
          <div className="mt-3 grid grid-cols-4 gap-2">
            <div className="col-span-4 space-y-1">
              <Label htmlFor="cname">اسم الوجبة</Label>
              <Input
                id="cname"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="مثال: أرز ودجاج"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ccal">سعرات</Label>
              <Input
                id="ccal"
                type="number"
                value={customCal}
                onChange={(e) => setCustomCal(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cprot">بروتين</Label>
              <Input
                id="cprot"
                type="number"
                value={customProt}
                onChange={(e) => setCustomProt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ccarb">كارب</Label>
              <Input
                id="ccarb"
                type="number"
                value={customCarbs}
                onChange={(e) => setCustomCarbs(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cfat">دهون</Label>
              <Input
                id="cfat"
                type="number"
                value={customFats}
                onChange={(e) => setCustomFats(e.target.value)}
              />
            </div>
            <div className="col-span-4">
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
                    type: mealType,
                    calories: Math.round(cal),
                    protein: Math.round(Number(customProt) || 0),
                    carbs: Math.round(Number(customCarbs) || 0),
                    fats: Math.round(Number(customFats) || 0),
                  });
                  setCustomName("");
                  setCustomCal("");
                  setCustomProt("");
                  setCustomCarbs("");
                  setCustomFats("");
                }}
              >
                أضف
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold">سجل وجبات اليوم</h2>
          {entries.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              لم تسجّل أي وجبة بعد اليوم.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">
                      <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                        {e.type}
                      </span>
                      {e.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      🔥 {e.calories} · 🥩 {e.protein}غ · 🍞 {e.carbs}غ · 🥑 {e.fats}غ
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
