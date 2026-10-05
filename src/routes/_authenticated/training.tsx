import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Trash2, TrendingUp, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel, Empty, DateNav, Stat } from "@/components/kit";
import { ScheduleEditor, WorkoutManager } from "@/components/manage";
import { useScheduledWorkout } from "@/components/trackers";
import { db, useCrud, useOptions, useRows, type Exercise, type Session, type WSet, type Workout } from "@/lib/data";
import { pretty, todayStr, weekStart, shift } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/training")({
  head: () => ({ meta: [{ title: "Training — 30-Day Transformation" }, { name: "description", content: "Weekly schedule, HSPU progression and workout history." }, { property: "og:title", content: "Training — 30-Day Transformation" }, { property: "og:description", content: "Weekly schedule, HSPU progression and workout history." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

function Page() {
  const [date, setDate] = useState(todayStr());
  return (
    <>
      <PageHeader title="Training" subtitle="Follow the schedule, record what you actually did." />
      <Tabs defaultValue="today">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="history">History & PRs</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
        </TabsList>
        <TabsContent value="today"><TodayTab date={date} setDate={setDate} /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
        <TabsContent value="schedule"><ScheduleEditor /></TabsContent>
        <TabsContent value="workouts"><WorkoutManager /></TabsContent>
      </Tabs>
    </>
  );
}

function TodayTab({ date, setDate }: { date: string; setDate: (d: string) => void }) {
  const { workout, isRest } = useScheduledWorkout(date);
  const { workouts } = useOptions();
  const active = workouts.filter((w) => !w.archived);
  const [pick, setPick] = useState<string>("");
  useEffect(() => setPick(""), [date]);
  const chosen = active.find((w) => w.id === pick) ?? workout;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DateNav date={date} onChange={setDate} />
        <select value={chosen?.id ?? ""} onChange={(e) => setPick(e.target.value)} className="rounded-md border bg-card px-2 py-1.5 text-sm" aria-label="Workout">
          <option value="" disabled>Choose workout</option>
          {active.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      {!chosen ? (
        <Panel><Empty>{isRest ? "Rest day. Recovery is part of the plan — pick a workout above if you train anyway." : "No workout scheduled. Pick one above."}</Empty></Panel>
      ) : chosen.tracking === "progressive" ? (
        <ProgressiveLogger key={chosen.id + date} workout={chosen} date={date} />
      ) : (
        <SimpleLogger workout={chosen} date={date} />
      )}
    </div>
  );
}

function SimpleLogger({ workout, date }: { workout: Workout; date: string }) {
  const sessions = useRows<Session>("workout_sessions", (b) => b.eq("session_date", date).eq("workout_id", workout.id), [date, workout.id]);
  const { insert, remove } = useCrud("workout_sessions");
  const done = sessions.data?.[0];
  return (
    <Panel title={workout.name}>
      <p className="mb-3 text-sm text-muted-foreground">Completion-only{workout.duration_minutes ? ` · ${workout.duration_minutes} minutes` : ""}. Did you do it?</p>
      {done ? (
        <Button variant="outline" className="border-success text-success" onClick={() => remove.mutate(done.id)}><Check className="mr-1 h-4 w-4" />Completed — tap to undo</Button>
      ) : (
        <Button onClick={() => insert.mutate({ workout_id: workout.id, session_date: date, completed: true, duration_minutes: workout.duration_minutes })}>Mark completed</Button>
      )}
    </Panel>
  );
}

type Draft = { value: string; weight: string };

function suggestion(ex: Exercise, prev: WSet[]) {
  if (!prev.length) return "First session — find a comfortable baseline.";
  const best = Math.max(...prev.map((s) => Number(s.value)));
  const allHit = ex.target_value ? prev.every((s) => Number(s.value) >= Number(ex.target_value)) : prev.length >= (ex.target_sets ?? 3);
  const step = ex.measurement === "time" ? "5 more seconds" : ex.measurement === "weight" ? "a small weight increase" : "1 more rep";
  return allHit ? `Last time felt solid (best ${best}). If you feel fresh, try ${step} on one set.` : `Match last session (best ${best}) before adding more. Quality first.`;
}

function ProgressiveLogger({ workout, date }: { workout: Workout; date: string }) {
  const qc = useQueryClient();
  const exQ = useRows<Exercise>("workout_exercises", (b) => b.eq("workout_id", workout.id).eq("archived", false).order("sort"), [workout.id]);
  const sessQ = useRows<Session>("workout_sessions", (b) => b.eq("workout_id", workout.id).lte("session_date", date).order("session_date", { ascending: false }).limit(2), [workout.id, date]);
  const current = sessQ.data?.find((s) => s.session_date === date);
  const previous = sessQ.data?.find((s) => s.session_date < date);
  const ids = [current?.id, previous?.id].filter((x): x is string => !!x);
  const setsQ = useRows<WSet>("workout_sets", (b) => b.in("session_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]).order("set_number"), [ids.join(",")]);
  const exercises = exQ.data ?? [];
  const [draft, setDraft] = useState<Record<string, Draft[]>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!exQ.data || !setsQ.data) return;
    const d: Record<string, Draft[]> = {};
    for (const ex of exQ.data) {
      const mine = current ? setsQ.data.filter((s) => s.session_id === current.id && s.exercise_id === ex.id) : [];
      d[ex.id] = mine.length
        ? mine.map((s) => ({ value: String(s.value), weight: s.weight != null ? String(s.weight) : "" }))
        : Array.from({ length: ex.target_sets ?? 1 }, () => ({ value: "", weight: "" }));
    }
    setDraft(d);
    setNote(current?.notes ?? "");
  }, [exQ.data, setsQ.data, current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevSets = (exId: string) => (previous ? (setsQ.data ?? []).filter((s) => s.session_id === previous.id && s.exercise_id === exId) : []);
  const upd = (exId: string, i: number, k: keyof Draft, v: string) =>
    setDraft((d) => ({ ...d, [exId]: (d[exId] ?? []).map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));

  async function save() {
    setSaving(true);
    try {
      let sid = current?.id;
      if (!sid) {
        const { data, error } = await db.from("workout_sessions").insert({ workout_id: workout.id, session_date: date, completed: true, notes: note || null }).select().single();
        if (error) throw error;
        sid = data.id as string;
      } else {
        const { error } = await db.from("workout_sessions").update({ notes: note || null }).eq("id", sid);
        if (error) throw error;
        const del = await db.from("workout_sets").delete().eq("session_id", sid);
        if (del.error) throw del.error;
      }
      const rows = exercises.flatMap((ex) =>
        (draft[ex.id] ?? []).filter((s) => s.value !== "").map((s, i) => ({ session_id: sid, exercise_id: ex.id, set_number: i + 1, value: Number(s.value), weight: s.weight === "" ? null : Number(s.weight) })),
      );
      if (rows.length) {
        const { error } = await db.from("workout_sets").insert(rows);
        if (error) throw error;
      }
      ["workout_sessions", "workout_sets"].forEach((t) => qc.invalidateQueries({ queryKey: [t] }));
      toast.success("Session saved");
    } catch (e) {
      toast.error((e as { message?: string }).message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function removeSession() {
    if (!current) return;
    await db.from("workout_sets").delete().eq("session_id", current.id);
    const { error } = await db.from("workout_sessions").delete().eq("id", current.id);
    if (error) { toast.error(error.message); return; }
    ["workout_sessions", "workout_sets"].forEach((t) => qc.invalidateQueries({ queryKey: [t] }));
    toast.success("Session removed");
  }

  if (!exercises.length) return <Panel title={workout.name}><Empty>No exercises yet. Add some in the Workouts tab.</Empty></Panel>;

  return (
    <Panel title={<span>{workout.name} <span className="ml-1 text-xs font-normal text-muted-foreground">{current ? "Logged — edit and save" : "New session"}</span></span>}
      action={previous ? <span className="text-xs text-muted-foreground">Previous: {pretty(previous.session_date)}</span> : undefined}>
      <div className="space-y-5">
        {exercises.map((ex) => {
          const prev = prevSets(ex.id);
          const unit = ex.unit ?? (ex.measurement === "time" ? "sec" : ex.measurement);
          return (
            <div key={ex.id} className="rounded-lg border p-3">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{ex.name} <span className="text-xs text-muted-foreground">({unit}{ex.target_sets ? ` · ${ex.target_sets} sets` : ""}{ex.target_value ? ` · target ${ex.target_value}` : ""})</span></p>
                {prev.length > 0 && <p className="text-xs text-muted-foreground tabular">Last: {prev.map((s) => s.value).join(" / ")}</p>}
              </div>
              <div className="space-y-2">
                {(draft[ex.id] ?? []).map((s, i) => {
                  const p = prev[i];
                  const diff = p && s.value !== "" ? Number(s.value) - Number(p.value) : null;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-12 text-xs text-muted-foreground">Set {i + 1}</span>
                      <Input inputMode="decimal" type="number" value={s.value} onChange={(e) => upd(ex.id, i, "value", e.target.value)} placeholder={p ? String(p.value) : unit} className="w-24" />
                      {ex.measurement === "weight" && <Input inputMode="decimal" type="number" value={s.weight} onChange={(e) => upd(ex.id, i, "weight", e.target.value)} placeholder="kg" className="w-20" />}
                      {diff !== null && <span className={cn("text-xs tabular", diff > 0 ? "text-success" : diff < 0 ? "text-muted-foreground" : "text-muted-foreground")}>{diff > 0 ? `+${diff}` : diff}</span>}
                      <Button size="icon" variant="ghost" aria-label="Remove set" onClick={() => setDraft((d) => ({ ...d, [ex.id]: (d[ex.id] ?? []).filter((_, j) => j !== i) }))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  );
                })}
                <Button size="sm" variant="ghost" onClick={() => setDraft((d) => ({ ...d, [ex.id]: [...(d[ex.id] ?? []), { value: "", weight: "" }] }))}><Plus className="mr-1 h-3.5 w-3.5" />Add set</Button>
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground"><TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" />{suggestion(ex, prev)}</p>
            </div>
          );
        })}
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Session notes (optional)" />
        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : current ? "Update session" : "Save session"}</Button>
          {current && <Button variant="ghost" className="text-destructive" onClick={removeSession}>Delete session</Button>}
        </div>
      </div>
    </Panel>
  );
}

function HistoryTab() {
  const { workouts } = useOptions();
  const since = shift(todayStr(), -89);
  const sessions = useRows<Session>("workout_sessions", (b) => b.gte("session_date", since).order("session_date", { ascending: false }), [since]);
  const sets = useRows<WSet>("workout_sets");
  const exs = useRows<Exercise>("workout_exercises", (b) => b.order("sort"));
  const list = sessions.data ?? [];
  const wk = weekStart(todayStr());
  const thisWeek = list.filter((s) => s.session_date >= wk && s.completed).length;
  const prs = useMemo(() => (exs.data ?? []).filter((e) => !e.archived).map((e) => {
    const mine = (sets.data ?? []).filter((s) => s.exercise_id === e.id);
    const best = mine.length ? Math.max(...mine.map((s) => Number(s.value))) : null;
    const volume = mine.reduce((a, s) => a + Number(s.value), 0);
    return { e, best, volume };
  }).filter((x) => x.best !== null), [exs.data, sets.data]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Workouts this week" value={thisWeek} />
        <Stat label="Last 90 days" value={list.filter((s) => s.completed).length} />
        <Stat label="Progressive sessions" value={list.filter((s) => workouts.find((w) => w.id === s.workout_id)?.tracking === "progressive").length} />
      </div>
      <Panel title={<span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" />Personal bests</span>}>
        {prs.length ? (
          <ul className="divide-y text-sm">{prs.map(({ e, best, volume }) => (
            <li key={e.id} className="flex justify-between py-2"><span>{e.name}</span><span className="tabular text-muted-foreground">best {best} {e.unit ?? ""} · total {volume}</span></li>
          ))}</ul>
        ) : <Empty>Record a progressive session to see personal bests.</Empty>}
      </Panel>
      <Panel title="Recent sessions">
        {list.length ? (
          <ul className="divide-y text-sm">{list.slice(0, 40).map((s) => {
            const w = workouts.find((x) => x.id === s.workout_id);
            const ss = (sets.data ?? []).filter((x) => x.session_id === s.id);
            return (
              <li key={s.id} className="py-2">
                <div className="flex justify-between"><span className="font-medium">{w?.name ?? "Workout"}</span><span className="text-muted-foreground">{pretty(s.session_date)}</span></div>
                {ss.length > 0 && <p className="mt-0.5 text-xs text-muted-foreground tabular">{(exs.data ?? []).filter((e) => ss.some((x) => x.exercise_id === e.id)).map((e) => `${e.name}: ${ss.filter((x) => x.exercise_id === e.id).map((x) => x.value).join("/")}`).join(" · ")}</p>}
                {s.notes && <p className="mt-0.5 text-xs italic text-muted-foreground">{s.notes}</p>}
              </li>
            );
          })}</ul>
        ) : <Empty>No sessions yet.</Empty>}
      </Panel>
    </div>
  );
}
