import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  calcTargets,
  type Activity,
  type Gender,
  type Goal,
  type Profile,
} from "@/lib/nutrition";

export function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [gender, setGender] = useState<Gender>("male");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("gain");

  const preview = calcTargets({ age, height, weight, gender, activity, goal });

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="bg-hero mb-6 rounded-3xl p-6 text-primary-foreground shadow-card">
          <h1 className="font-display text-2xl font-bold">رفيق التغذية الذكي 🥗</h1>
          <p className="mt-1 text-sm opacity-90">
            أدخل بياناتك لنحسب سعراتك وبروتينك اليومي بمعادلة Mifflin-St Jeor.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = calcTargets({ age, height, weight, gender, activity, goal });
            onDone({
              name: name.trim() || "صديقي",
              age,
              height,
              weight,
              gender,
              activity,
              goal,
              targetCal: t.targetCal,
              targetProt: t.targetProt,
              targetCarbs: t.targetCarbs,
              targetFats: t.targetFats,
            });
          }}
          className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card"
        >
          <div className="space-y-2">
            <Label htmlFor="name">الاسم</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسمك الكريم"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="weight">الوزن (كغ)</Label>
              <Input
                id="weight"
                type="number"
                min={25}
                max={300}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">الطول (سم)</Label>
              <Input
                id="height"
                type="number"
                min={100}
                max={230}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">العمر</Label>
              <Input
                id="age"
                type="number"
                min={10}
                max={100}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الجنس</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as Gender[]).map((g) => (
                <Button
                  key={g}
                  type="button"
                  variant={gender === g ? "default" : "outline"}
                  onClick={() => setGender(g)}
                >
                  {g === "male" ? "ذكر 👨" : "أنثى 👩"}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>مستوى النشاط</Label>
            <Select value={activity} onValueChange={(v) => setActivity(v as Activity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>الهدف</Label>
            <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GOAL_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
            <p>
              معدل الأيض الأساسي: <strong>{preview.bmr}</strong> سعرة — احتياجك اليومي:{" "}
              <strong>{preview.tdee}</strong> سعرة
            </p>
            <p className="mt-1">
              هدفك: <strong>{preview.targetCal}</strong> سعرة و{" "}
              <strong>{preview.targetProt}</strong> غ بروتين
            </p>
            <p className="mt-1">
              كارب: <strong>{preview.targetCarbs}</strong> غ · دهون:{" "}
              <strong>{preview.targetFats}</strong> غ
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg">
            ابدأ التطبيق 🚀
          </Button>
        </form>
      </div>
    </div>
  );
}
