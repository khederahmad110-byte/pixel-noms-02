import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  BellRing,
  Camera,
  Loader2,
  RotateCcw,
  Scale,
  Search,
  Star,
  Trash2,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatBar } from "@/components/StatBar";
import { MicroTracker } from "@/components/MicroTracker";
import { HistoryView } from "@/components/HistoryView";
import type { DayArchive } from "@/lib/history";
import { EditPlanDialog } from "@/components/EditPlanDialog";
import { analyzeMeal, type MealAnalysis } from "@/lib/analyze-meal.functions";
import { MICRO_INFO, calcDRI, sumMicros, MICRO_KEYS } from "@/lib/micronutrients";
import { announce, requestNotifyPermission, speak } from "@/lib/notify";
import {
  GOAL_LABELS,
  MACRO_NOTES,
  MEAL_TYPES,
  QUICK_MEALS,
  type FoodEntry,
  type MealTemplate,
  type MealType,
  type Profile,
  type WeightEntry,
} from "@/lib/nutrition";

export function Dashboard({
  profile,
  entries,
  templates,
  weights,
  archive,
  weighInDue,
  onAdd,
  onRemove,
  onReset,
  onSaveTemplate,
  onDeleteTemplate,
  onUpdateProfile,
  onAddWeight,
}: {
  profile: Profile;
  entries: FoodEntry[];
  templates: MealTemplate[];
  weights: WeightEntry[];
  archive: DayArchive;
  weighInDue: boolean;
  onAdd: (e: Omit<FoodEntry, "id" | "at">) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
  onSaveTemplate: (t: Omit<MealTemplate, "id" | "uses">) => void;
  onDeleteTemplate: (id: string) => void;
  onUpdateProfile: (p: Profile) => void;
  onAddWeight: (w: number) => void;
}) {
  const analyze = useServerFn(analyzeMeal);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mealType, setMealType] = useState<MealType>("فطور");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [newWeight, setNewWeight] = useState(String(profile.weight));

  const consumed = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (Number(e.calories) || 0),
      protein: acc.protein + (Number(e.protein) || 0),
      carbs: acc.carbs + (Number(e.carbs) || 0),
      fats: acc.fats + (Number(e.fats) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );

  // تذكير القياس الأسبوعي
  useEffect(() => {
    if (!weighInDue) return;
    const t = setTimeout(() => {
      announce("تذكير القياس الأسبوعي ⚖️", "سجّل وزنك الحالي لمتابعة تطور خطتك.");
      toast("حان وقت تسجيل وزنك الأسبوعي ⚖️", {
        description: "افتح تبويب «الملف» وسجّل وزنك الحالي.",
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [weighInDue]);

  const pushResult = (result: MealAnalysis, prefix: string) => {
    onAdd({
      label: `${prefix} ${result.name}`,
      type: mealType,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fats: result.fats,
      micros: result.micros,
    });
    onSaveTemplate({
      label: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fats: result.fats,
      micros: result.micros,
    });
    const microTop = MICRO_KEYS.filter((k) => (result.micros?.[k] ?? 0) > 0)
      .slice(0, 3)
      .map((k) => MICRO_INFO[k].label);
    toast.success(
      `تم التحليل: ${result.calories} سعرة · ${result.protein}غ بروتين · ${result.carbs}غ كارب · ${result.fats}غ دهون`,
      {
        description:
          [result.items.join("، "), microTop.length ? `غني بـ: ${microTop.join("، ")}` : ""]
            .filter(Boolean)
            .join(" — ") || undefined,
      },
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

  const speakSummary = () => {
    const dri = calcDRI({ gender: profile.gender, age: profile.age });
    const micros = sumMicros(entries.map((e) => e.micros ?? {}));
    const missing = MICRO_KEYS.filter((k) => (micros[k] ?? 0) < dri[k] * 0.7).slice(0, 3);
    announce(
      "ملخصك الغذائي",
      `استهلكت ${Math.round(consumed.calories)} سعرة من ${profile.targetCal}، ` +
        `${Math.round(consumed.protein)} غرام بروتين، ${Math.round(consumed.carbs)} غرام كربوهيدرات، ` +
        `و${Math.round(consumed.fats)} غرام دهون.` +
        (missing.length
          ? ` لديك نقص في ${missing.map((k) => MICRO_INFO[k].label).join("، ")}.`
          : " تغطيتك من الفيتامينات جيدة."),
    );
  };

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

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">🍽️ اليوم</TabsTrigger>
            <TabsTrigger value="micros">💊 المغذيات</TabsTrigger>
            <TabsTrigger value="history">📅 السجل</TabsTrigger>
            <TabsTrigger value="profile">👤 الملف</TabsTrigger>
          </TabsList>

          {/* ============ اليوم ============ */}
          <TabsContent value="today" className="mt-5 space-y-5">
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
                اكتب مكونات الوجبة ليحسب النظام السعرات والماكروز والفيتامينات تلقائياً.
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
                      <div className="flex items-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="حفظ كقالب"
                          onClick={() => {
                            onSaveTemplate({
                              label: e.label.replace(/^[^\p{L}\d]+/u, "").trim() || e.label,
                              calories: e.calories,
                              protein: e.protein,
                              carbs: e.carbs,
                              fats: e.fats,
                              micros: e.micros,
                            });
                            toast.success("حُفظت للاستخدام السريع ⭐");
                          }}
                        >
                          <Star className="size-4 text-primary" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onRemove(e.id)}
                          aria-label="حذف الوجبة"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>

          {/* ============ المغذيات الدقيقة ============ */}
          <TabsContent value="micros" className="mt-5">
            <MicroTracker profile={profile} entries={entries} />
          </TabsContent>

          {/* ============ السجل والأرشيف ============ */}
          <TabsContent value="history" className="mt-5">
            <HistoryView archive={archive} profile={profile} />
          </TabsContent>

          {/* ============ الملف الشخصي ============ */}
          <TabsContent value="profile" className="mt-5 space-y-5">
            <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-semibold">خطتي الحالية</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                🔥 {profile.targetCal} سعرة · 🥩 {profile.targetProt}غ · 🍞{" "}
                {profile.targetCarbs}غ · 🥑 {profile.targetFats}غ
              </p>
              <div className="mt-3">
                <EditPlanDialog profile={profile} onSave={onUpdateProfile} />
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-semibold">⚖️ متابعة الوزن (تذكير أسبوعي)</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {weighInDue
                  ? "حان وقت تسجيل وزنك الأسبوعي!"
                  : "سنذكّرك أسبوعياً بتسجيل وزنك."}
              </p>
              <div className="mt-3 flex gap-2">
                <Input
                  type="number"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="الوزن بالكيلوغرام"
                />
                <Button
                  onClick={() => {
                    const w = Number(newWeight);
                    if (!w || w < 25 || w > 300) {
                      toast.error("أدخل وزناً صحيحاً");
                      return;
                    }
                    onAddWeight(w);
                    toast.success(`سُجّل وزنك: ${w} كغ`);
                  }}
                >
                  <Scale className="size-4" /> تسجيل
                </Button>
              </div>
              {weights.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {weights.slice(0, 6).map((w, i) => {
                    const prev = weights[i + 1];
                    const diff = prev ? w.weight - prev.weight : 0;
                    return (
                      <li key={w.id} className="flex justify-between">
                        <span>{new Date(w.at).toLocaleDateString("ar-EG")}</span>
                        <span>
                          {w.weight} كغ{" "}
                          {prev ? (
                            <strong className={diff >= 0 ? "text-success" : "text-fats"}>
                              ({diff > 0 ? "+" : ""}
                              {diff.toFixed(1)})
                            </strong>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-semibold">🔔 الإشعارات والتنبيهات الصوتية</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                فعّل الإشعارات لتذكيرك بمواعيد الوجبات (٨ ص، ١ م، ٨ م)، التذكير الأسبوعي
                بالوزن، وقراءة الملخص الغذائي بصوت واضح.
              </p>
              <div className="mt-3 grid gap-2">
                <Button
                  onClick={async () => {
                    const ok = await requestNotifyPermission();
                    if (ok) {
                      announce("تم تفعيل الإشعارات ✅", "سنذكّرك بمواعيد وجباتك وملخصك اليومي.");
                      toast.success("تم تفعيل الإشعارات");
                    } else {
                      toast.error("لم يتم السماح بالإشعارات من المتصفح");
                    }
                  }}
                >
                  <BellRing className="size-4" /> تفعيل الإشعارات
                </Button>
                <Button
                  variant="outline"
                  onClick={() => speak("تجربة الصوت. هذا هو صوت تنبيهات رفيق التغذية.")}
                >
                  <Volume2 className="size-4" /> تجربة الصوت
                </Button>
                <Button variant="outline" onClick={speakSummary}>
                  <Volume2 className="size-4" /> اقرأ ملخص اليوم
                </Button>
              </div>
            </section>

            <Button variant="ghost" className="w-full" onClick={onReset}>
              <RotateCcw className="size-4" /> إعادة تعيين البيانات
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
