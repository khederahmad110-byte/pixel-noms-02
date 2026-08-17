import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { Onboarding } from "@/components/Onboarding";
import { todayKey, type FoodEntry, type Profile } from "@/lib/nutrition";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رفيق التغذية الذكي — تتبع السعرات والبروتين" },
      {
        name: "description",
        content:
          "تطبيق عربي لتتبع السعرات الحرارية والبروتين، مع حساب الهدف اليومي وتحليل صور الوجبات بالذكاء الاصطناعي.",
      },
      { property: "og:title", content: "رفيق التغذية الذكي 🥗" },
      {
        property: "og:description",
        content: "احسب سعراتك وبروتينك اليومي وتتبّع وجباتك بذكاء.",
      },
    ],
  }),
  component: Index,
});

const PROFILE_KEY = "nutri.profile";
const LOG_KEY = "nutri.log";

function Index() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);

  useEffect(() => {
    try {
      const p = localStorage.getItem(PROFILE_KEY);
      if (p) setProfile(JSON.parse(p) as Profile);
      const log = localStorage.getItem(LOG_KEY);
      if (log) {
        const parsed = JSON.parse(log) as { day: string; entries: FoodEntry[] };
        if (parsed.day === todayKey()) setEntries(parsed.entries);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(LOG_KEY, JSON.stringify({ day: todayKey(), entries }));
  }, [entries, ready]);

  if (!ready) return <div className="min-h-screen bg-background" />;

  if (!profile) {
    return (
      <Onboarding
        onDone={(p) => {
          localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
          setProfile(p);
        }}
      />
    );
  }

  return (
    <Dashboard
      profile={profile}
      entries={entries}
      onAdd={(e) =>
        setEntries((prev) => [
          { ...e, id: crypto.randomUUID(), at: Date.now() },
          ...prev,
        ])
      }
      onRemove={(id) => setEntries((prev) => prev.filter((e) => e.id !== id))}
      onReset={() => {
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem(LOG_KEY);
        setEntries([]);
        setProfile(null);
      }}
    />
  );
}
