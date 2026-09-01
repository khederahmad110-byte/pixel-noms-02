import { useState } from "react";
import { Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  type Goal,
  type Profile,
} from "@/lib/nutrition";

export function EditPlanDialog({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (p: Profile) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(profile);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const recalc = () => {
    const t = calcTargets(form);
    setForm((f) => ({
      ...f,
      targetCal: t.targetCal,
      targetProt: t.targetProt,
      targetCarbs: t.targetCarbs,
      targetFats: t.targetFats,
    }));
    toast.success("أُعيد حساب الأهداف تلقائياً");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setForm(profile);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Pencil className="size-4" /> تعديل الخطة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto text-right">
        <DialogHeader>
          <DialogTitle>تعديل خطة التغذية</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>الوزن (كغ)</Label>
            <Input
              type="number"
              value={form.weight}
              onChange={(e) => set("weight", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label>الطول (سم)</Label>
            <Input
              type="number"
              value={form.height}
              onChange={(e) => set("height", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label>العمر</Label>
            <Input
              type="number"
              value={form.age}
              onChange={(e) => set("age", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label>مستوى النشاط</Label>
          <Select
            value={form.activity}
            onValueChange={(v) => set("activity", v as Activity)}
          >
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

        <div className="space-y-1">
          <Label>الهدف</Label>
          <Select value={form.goal} onValueChange={(v) => set("goal", v as Goal)}>
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

        <Button type="button" variant="secondary" onClick={recalc}>
          <RefreshCw className="size-4" /> إعادة حساب الأهداف من بياناتي
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>🔥 السعرات</Label>
            <Input
              type="number"
              value={form.targetCal}
              onChange={(e) => set("targetCal", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label>🥩 البروتين (غ)</Label>
            <Input
              type="number"
              value={form.targetProt}
              onChange={(e) => set("targetProt", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label>🍞 الكربوهيدرات (غ)</Label>
            <Input
              type="number"
              value={form.targetCarbs}
              onChange={(e) => set("targetCarbs", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label>🥑 الدهون (غ)</Label>
            <Input
              type="number"
              value={form.targetFats}
              onChange={(e) => set("targetFats", Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            onClick={() => {
              if (!form.targetCal || form.targetCal < 800) {
                toast.error("أدخل هدف سعرات منطقي (800 فأكثر)");
                return;
              }
              onSave({
                ...form,
                targetCal: Math.round(form.targetCal),
                targetProt: Math.round(form.targetProt || 0),
                targetCarbs: Math.round(form.targetCarbs || 0),
                targetFats: Math.round(form.targetFats || 0),
              });
              setOpen(false);
              toast.success("تم تحديث خطتك وتزامنت مع أشرطة التقدم ✅");
            }}
          >
            حفظ الخطة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
