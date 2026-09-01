/** أدوات الإشعارات والتنبيهات الصوتية (تعمل في المتصفح فقط). */

export function canNotify() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotifyPermission(): Promise<boolean> {
  if (!canNotify()) return false;
  if (Notification.permission === "granted") return true;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function pushNotification(title: string, body: string) {
  if (!canNotify() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/favicon.ico" });
  } catch {
    /* ignore */
  }
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function announce(title: string, body: string) {
  pushNotification(title, body);
  speak(`${title}. ${body}`);
}

/** مواعيد الوجبات الافتراضية (ساعة اليوم). */
export const MEAL_REMINDERS: { hour: number; label: string }[] = [
  { hour: 8, label: "وقت الفطور 🍳 لا تنسَ تسجيل وجبتك" },
  { hour: 13, label: "وقت الغداء 🍲 سجّل وجبتك للحفاظ على هدفك" },
  { hour: 20, label: "وقت العشاء 🥗 أكمل سعراتك اليومية" },
];
