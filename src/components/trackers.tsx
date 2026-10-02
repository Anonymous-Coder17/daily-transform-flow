import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Minus, Plus, ShieldCheck, ShieldAlert, Timer, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, Empty } from "@/components/kit";
import { cn } from "@/lib/utils";
import {
  useRows, useCrud, sum, useOptions,
  type Habit, type HabitLog, type AbstRule, type AbstLog, type Limit, type LimitLog, type HifzLog,
  type ReadingLog, type StudySession, type ScheduleRow, type Workout, type Session,
} from "@/lib/data";
import { fmtMinutes, shift, weekStart, weekdayOf } from "@/lib/dates";

export function isHabitDue(h: Habit, date: string) {
  if (h.frequency_type === "weekdays") return h.weekdays.includes(weekdayOf(date));
  return true;
}

export function freqLabel(h: Habit) {
  const W = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (h.frequency_type === "daily") return "Daily";
  if (h.frequency_type === "weekdays") return h.weekdays.map((d) => W[d]).join(", ") || "No days";
  if (h.frequency_type === "weekly_target") return `${h.weekly_target ?? 1}× per week`;
  return h.custom_rule || "Custom";
}

/* ---------------- Habits ---------------- */
export function HabitsToday({ date, compact }: { date: string; compact?: boolean }) {
  const habits = useRows<Habit>("habits", (b) => b.eq("archived", false).order("sort"));
  const ws = weekStart(date);
  const logs = useRows<HabitLog>("habit_logs", (b) => b.gte("log_date", ws).lte("log_date", shift(ws, 6)), [ws]);
  const { upsert, remove } = useCrud("habit_logs");
  const list = (habits.data ?? []).filter((h) => isHabitDue(h, date));

  return (
    <Panel title="Habits" action={compact && <Link to="/habits" className="text-xs text-muted-foreground hover:text-foreground">Manage</Link>}>
      {!list.length ? <Empty>No habits scheduled for this day.</Empty> : (
        <ul className="space-y-2">
          {list.map((h) => {
            const log = logs.data?.find((l) => l.habit_id === h.id && l.log_date === date);
            const weekDone = logs.data?.filter((l) => l.habit_id === h.id && l.completed).length ?? 0;
            const done = !!log?.completed;
            const save = (completed: boolean, value?: number | null) =>
              upsert.mutate({ row: { habit_id: h.id, log_date: date, completed, value: value ?? null }, onConflict: "habit_id,log_date" });
            return (
              <li key={h.id} className="flex items-center gap-3 rounded-lg border bg-surface/60 px-3 py-2">
                {h.tracking_type === "completion" ? (
                  <button
                    aria-label={`Toggle ${h.name}`}
                    onClick={() => (done && log ? remove.mutate(log.id) : save(true))}
                    className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors", done ? "border-success bg-success text-success-foreground" : "border-border hover:border-primary")}
                  >
                    {done && <Check className="h-4 w-4" />}
                  </button>
                ) : (
                  <ValueInput
                    value={log?.value ?? null}
                    suffix={h.tracking_type === "duration" ? "min" : h.unit || ""}
                    onSave={(v) => save(h.target_value ? v >= Number(h.target_value) : v > 0, v)}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-medium", done && "text-muted-foreground")}>{h.name}{h.is_optional && <span className="ml-2 text-xs font-normal text-muted-foreground">optional</span>}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.frequency_type === "weekly_target" ? `${weekDone}/${h.weekly_target ?? 1} this week` : freqLabel(h)}
                    {h.target_value ? ` · target ${h.target_value}${h.tracking_type === "duration" ? " min" : ` ${h.unit ?? ""}`}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function ValueInput({ value, onSave, suffix }: { value: number | null; onSave: (v: number) => void; suffix?: string }) {
  const [v, setV] = useState(value?.toString() ?? "");
  useEffect(() => setV(value?.toString() ?? ""), [value]);
  return (
    <div className="flex items-center gap-1">
      <Input
        inputMode="numeric" className="h-8 w-16 text-center tabular" value={v} placeholder="0"
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== (value?.toString() ?? "") && v !== "" && onSave(Number(v))}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </div>
  );
}

/* ---------------- Abstain ---------------- */
export function AbstainToday({ date }: { date: string }) {
  const rules = useRows<AbstRule>("abstinence_rules", (b) => b.eq("archived", false).order("sort"));
  const logs = useRows<AbstLog>("abstinence_logs", (b) => b.eq("log_date", date), [date]);
  const { upsert, remove } = useCrud("abstinence_logs");
  const [incidentFor, setIncidentFor] = useState<string | null>(null);
  const [trigger, setTrigger] = useState("");
  const [note, setNote] = useState("");

  return (
    <Panel title={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" />Abstain <span className="font-normal text-muted-foreground">· complete avoidance</span></span>}>
      {!rules.data?.length ? <Empty>No abstain rules yet.</Empty> : (
        <ul className="space-y-2">
          {rules.data.map((r) => {
            const log = logs.data?.find((l) => l.rule_id === r.id);
            return (
              <li key={r.id} className="rounded-lg border bg-surface/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-sm font-medium">{r.name}</p>
                  <Button size="sm" variant={log?.status === "clean" ? "default" : "outline"} className={cn("h-7", log?.status === "clean" && "bg-success text-success-foreground hover:bg-success/90")}
                    onClick={() => (log?.status === "clean" ? remove.mutate(log.id) : upsert.mutate({ row: { rule_id: r.id, log_date: date, status: "clean", trigger_note: null, note: null }, onConflict: "rule_id,log_date" }))}>
                    Clean
                  </Button>
                  <Button size="sm" variant={log?.status === "incident" ? "destructive" : "outline"} className="h-7"
                    onClick={() => { setIncidentFor(incidentFor === r.id ? null : r.id); setTrigger(log?.trigger_note ?? ""); setNote(log?.note ?? ""); }}>
                    Incident
                  </Button>
                </div>
                {log?.status === "incident" && incidentFor !== r.id && (log.trigger_note || log.note) && (
                  <p className="mt-1 text-xs text-muted-foreground">{log.trigger_note && <>Trigger: {log.trigger_note}. </>}{log.note}</p>
                )}
                {incidentFor === r.id && (
                  <div className="mt-2 space-y-2">
                    <Input placeholder="Trigger (optional) — e.g. boredom, late night" value={trigger} onChange={(e) => setTrigger(e.target.value)} className="h-8" />
                    <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="h-8" />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">Logged honestly. Your challenge continues.</p>
                      <div className="flex gap-2">
                        {log?.status === "incident" && <Button size="sm" variant="ghost" onClick={() => { remove.mutate(log.id); setIncidentFor(null); }}>Clear</Button>}
                        <Button size="sm" onClick={() => { upsert.mutate({ row: { rule_id: r.id, log_date: date, status: "incident", trigger_note: trigger || null, note: note || null }, onConflict: "rule_id,log_date" }); setIncidentFor(null); }}>Save</Button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/* ---------------- Limits ---------------- */
export function LimitsToday({ date }: { date: string }) {
  const limits = useRows<Limit>("limits", (b) => b.eq("archived", false).order("sort"));
  const logs = useRows<LimitLog>("limit_logs", (b) => b.eq("log_date", date), [date]);
  const { upsert } = useCrud("limit_logs");
  return (
    <Panel title={<span className="flex items-center gap-2"><Timer className="h-4 w-4 text-warning" />Limits <span className="font-normal text-muted-foreground">· controlled usage</span></span>}>
      {!limits.data?.length ? <Empty>No usage limits yet.</Empty> : (
        <ul className="space-y-3">
          {limits.data.map((l) => {
            const m = logs.data?.find((x) => x.limit_id === l.id)?.minutes ?? 0;
            const pct = Math.min(100, (m / l.daily_limit_minutes) * 100);
            const over = m > l.daily_limit_minutes;
            const set = (v: number) => upsert.mutate({ row: { limit_id: l.id, log_date: date, minutes: Math.max(0, v) }, onConflict: "limit_id,log_date" });
            return (
              <li key={l.id}>
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-sm font-medium">{l.name}</p>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => set(m - 5)} aria-label="Minus 5 minutes"><Minus className="h-3.5 w-3.5" /></Button>
                  <ValueInput value={m} onSave={set} />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => set(m + 5)} aria-label="Plus 5 minutes"><Plus className="h-3.5 w-3.5" /></Button>
                  <span className={cn("w-16 text-right text-xs tabular", over ? "text-destructive" : "text-muted-foreground")}>/ {l.daily_limit_minutes}m</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", over ? "bg-destructive" : pct > 80 ? "bg-warning" : "bg-success")} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/* ---------------- Hifz ---------------- */
export function HifzQuick({ date }: { date: string }) {
  const logs = useRows<HifzLog>("hifz_logs", (b) => b.eq("log_date", date), [date]);
  const { upsert } = useCrud("hifz_logs");
  const cur = logs.data?.[0];
  const [v, setV] = useState("");
  useEffect(() => setV(cur ? String(cur.ayahs) : ""), [cur]);
  const save = (n: number) => upsert.mutate({ row: { log_date: date, ayahs: Math.max(0, n) }, onConflict: "user_id,log_date" });
  return (
    <Panel title="Hifz" action={<span className="text-xs text-muted-foreground">{cur ? `${cur.ayahs} ayahs logged` : "Not logged"}</span>}>
      <div className="flex items-center gap-2">
        <Input inputMode="numeric" placeholder="Ayahs" value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, ""))} className="h-9 w-24 text-center tabular"
          onKeyDown={(e) => e.key === "Enter" && v !== "" && save(Number(v))} />
        <Button size="sm" onClick={() => save(Number(v || 0))}>Save</Button>
        {[1, 3, 5].map((n) => <Button key={n} size="sm" variant="outline" onClick={() => save((cur?.ayahs ?? 0) + n)}>+{n}</Button>)}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Any number counts — 0 is a valid entry, not a failure.</p>
    </Panel>
  );
}

/* ---------------- Reading ---------------- */
export function ReadingQuick({ date }: { date: string }) {
  const { books } = useOptions();
  const active = books.filter((b) => !b.archived);
  const logs = useRows<ReadingLog>("reading_logs", (b) => b.eq("log_date", date), [date]);
  const { insert } = useCrud("reading_logs");
  const [book, setBook] = useState("");
  const [pages, setPages] = useState("");
  const total = sum((logs.data ?? []).map((l) => l.pages));
  const bookId = book || active[0]?.id || "";
  return (
    <Panel title="Reading" action={<span className="text-xs text-muted-foreground">{total} pages today</span>}>
      {!active.length ? <Empty>Add a book in Habits → Reading.</Empty> : (
        <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => {
          e.preventDefault();
          if (!pages) return;
          insert.mutate({ book_id: bookId, log_date: date, pages: Number(pages) }, { onSuccess: () => { setPages(""); toast.success("Reading logged"); } });
        }}>
          <select value={bookId} onChange={(e) => setBook(e.target.value)} className="h-9 min-w-0 flex-1 rounded-md border bg-card px-2 text-sm">
            {active.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
          <Input inputMode="numeric" placeholder="Pages" value={pages} onChange={(e) => setPages(e.target.value.replace(/\D/g, ""))} className="h-9 w-20 text-center" />
          <Button size="sm" type="submit">Add</Button>
        </form>
      )}
    </Panel>
  );
}

/* ---------------- Study ---------------- */
export function StudyToday({ date }: { date: string }) {
  const { subjects } = useOptions();
  const sessions = useRows<StudySession>("study_sessions", (b) => b.eq("session_date", date), [date]);
  const list = sessions.data ?? [];
  const total = sum(list.map((s) => s.duration_minutes));
  const by = subjects.map((s) => ({ s, m: sum(list.filter((x) => x.subject_id === s.id).map((x) => x.duration_minutes)) })).filter((x) => x.m > 0);
  return (
    <Panel title="Study" action={<Link to="/study" className="text-xs font-medium text-primary">Open timer →</Link>}>
      <p className="font-display text-2xl tabular">{fmtMinutes(total)}</p>
      {by.length ? (
        <ul className="mt-2 space-y-1 text-sm">
          {by.map(({ s, m }) => <li key={s.id} className="flex justify-between"><span className="text-muted-foreground">{s.name}</span><span className="tabular">{fmtMinutes(m)}</span></li>)}
        </ul>
      ) : <p className="mt-1 text-xs text-muted-foreground">No study sessions recorded for this day.</p>}
    </Panel>
  );
}

/* ---------------- Workout ---------------- */
export function useScheduledWorkout(date: string) {
  const schedule = useRows<ScheduleRow>("workout_schedule");
  const { workouts } = useOptions();
  const row = schedule.data?.find((s) => s.weekday === weekdayOf(date));
  const workout = row?.workout_id ? workouts.find((w) => w.id === row.workout_id) : undefined;
  return { workout, isRest: !!row && !row.workout_id, loading: schedule.isLoading };
}

export function WorkoutToday({ date }: { date: string }) {
  const { workout, isRest } = useScheduledWorkout(date);
  const sessions = useRows<Session>("workout_sessions", (b) => b.eq("session_date", date), [date]);
  const { insert, remove } = useCrud("workout_sessions");
  const { workouts } = useOptions();
  const done = (sessions.data ?? []).filter((s) => s.completed);
  const doneFor = (w: Workout) => done.find((s) => s.workout_id === w.id);

  return (
    <Panel title={<span className="flex items-center gap-2"><Dumbbell className="h-4 w-4 text-chart-2" />Workout</span>} action={<Link to="/training" className="text-xs font-medium text-primary">Training →</Link>}>
      {workout ? (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">{workout.name}</p>
            <p className="text-xs text-muted-foreground">{workout.tracking === "progressive" ? "Progressive · record sets" : "Completion"}</p>
          </div>
          {doneFor(workout) ? (
            <Button size="sm" variant="outline" className="border-success text-success" onClick={() => workout.tracking === "simple" && remove.mutate(doneFor(workout)!.id)}><Check className="mr-1 h-4 w-4" />Done</Button>
          ) : workout.tracking === "progressive" ? (
            <Button size="sm" asChild><Link to="/training">Record sets</Link></Button>
          ) : (
            <Button size="sm" onClick={() => insert.mutate({ workout_id: workout.id, session_date: date, completed: true, duration_minutes: workout.duration_minutes })}>Mark done</Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{isRest ? "Rest day. Recovery is part of the plan." : "No workout scheduled."}</p>
      )}
      {done.filter((s) => s.workout_id !== workout?.id).map((s) => (
        <p key={s.id} className="mt-2 text-xs text-muted-foreground">Also done: {workouts.find((w) => w.id === s.workout_id)?.name}</p>
      ))}
    </Panel>
  );
}
