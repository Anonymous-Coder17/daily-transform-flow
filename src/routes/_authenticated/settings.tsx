import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel } from "@/components/kit";
import { AbstainManager, BookManager, HabitManager, LimitManager, ScheduleEditor, SubjectManager, WorkoutManager } from "@/components/manage";
import { db, useChallenge, useCrud, useRows, type TableName } from "@/lib/data";
import type { Tables } from "@/integrations/supabase/types";
import { useTheme, type Theme } from "@/lib/theme";
import { pretty, todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — 30-Day Transformation" }, { name: "description", content: "Challenge, trackers, theme, integrations and export." }, { property: "og:title", content: "Settings — 30-Day Transformation" }, { property: "og:description", content: "Challenge, trackers, theme, integrations and export." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Settings" />
      <Tabs defaultValue="challenge">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="challenge">Challenge</TabsTrigger>
          <TabsTrigger value="trackers">Trackers</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="study">Study & books</TabsTrigger>
          <TabsTrigger value="app">App</TabsTrigger>
        </TabsList>
        <TabsContent value="challenge"><ChallengeForm /></TabsContent>
        <TabsContent value="trackers" className="space-y-4"><HabitManager /><AbstainManager /><LimitManager /></TabsContent>
        <TabsContent value="training" className="space-y-4"><ScheduleEditor /><WorkoutManager /></TabsContent>
        <TabsContent value="study" className="space-y-4"><SubjectManager /><BookManager /></TabsContent>
        <TabsContent value="app" className="space-y-4"><ThemePicker /><Integrations /><Export /></TabsContent>
      </Tabs>
    </>
  );
}

function ChallengeForm() {
  const { challenge } = useChallenge();
  const { update } = useCrud("challenges");
  const [f, setF] = useState({ title: "", start_date: todayStr(), end_date: todayStr(), why: "" });
  useEffect(() => {
    if (challenge) setF({ title: challenge.title, start_date: challenge.start_date, end_date: challenge.end_date, why: challenge.why ?? "" });
  }, [challenge?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!challenge) return <Panel><p className="text-sm text-muted-foreground">Loading…</p></Panel>;
  function save() {
    if (!challenge) return;
    if (!f.title.trim()) { toast.error("Title is required"); return; }
    if (f.end_date < f.start_date) { toast.error("End date must be after start date"); return; }
    update.mutate({ id: challenge.id, title: f.title.trim(), start_date: f.start_date, end_date: f.end_date, why: f.why.trim() || null }, { onSuccess: () => toast.success("Challenge saved") });
  }
  return (
    <Panel title="Your challenge">
      <div className="grid gap-3 md:max-w-xl">
        <label className="text-sm"><span className="mb-1 block text-muted-foreground">Title</span><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm"><span className="mb-1 block text-muted-foreground">Start</span><Input type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></label>
          <label className="text-sm"><span className="mb-1 block text-muted-foreground">End</span><Input type="date" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></label>
        </div>
        <label className="text-sm"><span className="mb-1 block text-muted-foreground">My why</span><Textarea value={f.why} onChange={(e) => setF({ ...f, why: e.target.value })} placeholder="Why does this matter to you?" className="min-h-28" /></label>
        <p className="text-xs text-muted-foreground">A slip never resets the challenge — it keeps running from its start date.</p>
        <div><Button onClick={save}>Save challenge</Button></div>
      </div>
    </Panel>
  );
}

function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const opts: { v: Theme; label: string; Icon: typeof Sun }[] = [{ v: "light", label: "Light", Icon: Sun }, { v: "dark", label: "Dark", Icon: Moon }, { v: "system", label: "System", Icon: Monitor }];
  return (
    <Panel title="Theme">
      <div className="flex gap-2">{opts.map(({ v, label, Icon }) => (
        <button key={v} onClick={() => setTheme(v)} className={cn("flex items-center gap-2 rounded-lg border px-4 py-2 text-sm", theme === v && "border-primary bg-primary/10 font-medium")}><Icon className="h-4 w-4" />{label}</button>
      ))}</div>
    </Panel>
  );
}

function Integrations() {
  const q = useRows<Tables<"integrations">>("integrations");
  const g = q.data?.find((i) => i.provider === "google_calendar");
  const connected = g?.status === "connected";
  return (
    <Panel title="Google Calendar">
      <div className="flex items-center gap-2 text-sm">
        <span className={cn("h-2.5 w-2.5 rounded-full", connected ? "bg-success" : "bg-muted-foreground/40")} />
        <span className="font-medium">{connected ? "Connected" : "Not connected"}</span>
        {g?.last_sync_at && <span className="text-muted-foreground">· last sync {pretty(g.last_sync_at.slice(0, 10))}</span>}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Google Calendar sync isn't set up yet. Your in-app calendar works fully on its own; events are stored in your account and ready for sync once it's added.</p>
      <Button className="mt-3" variant="outline" disabled>Connect Google Calendar (coming later)</Button>
    </Panel>
  );
}

const EXPORT_TABLES: TableName[] = ["challenges", "review_metrics", "habits", "habit_logs", "abstinence_rules", "abstinence_logs", "limits", "limit_logs", "workouts", "workout_exercises", "workout_schedule", "workout_sessions", "workout_sets", "subjects", "topics", "study_sessions", "hifz_logs", "books", "reading_logs", "calendar_events", "event_actuals", "tasks", "journal_entries"];

function Export() {
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const out: Record<string, unknown> = { exported_at: new Date().toISOString() };
      for (const t of EXPORT_TABLES) {
        const { data, error } = await db.from(t).select("*");
        if (error) throw error;
        out[t] = data;
      }
      const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url; a.download = `transformation-export-${todayStr()}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as { message?: string }).message ?? "Export failed");
    } finally { setBusy(false); }
  }
  return (
    <Panel title="Export data">
      <p className="mb-3 text-sm text-muted-foreground">Download everything you've recorded as a JSON file.</p>
      <Button variant="outline" onClick={run} disabled={busy}><Download className="mr-1 h-4 w-4" />{busy ? "Preparing…" : "Export JSON"}</Button>
    </Panel>
  );
}
