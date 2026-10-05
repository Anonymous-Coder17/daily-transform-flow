import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, Stat, Empty } from "@/components/kit";
import { isHabitDue } from "@/components/trackers";
import {
  sum, useChallenge, useCrud, useOptions, useRows,
  type AbstLog, type AbstRule, type CalEvent, type EventActual, type Exercise, type Habit, type HabitLog, type HifzLog,
  type Journal, type Limit, type LimitLog, type Metric, type ReadingLog, type Session, type StudySession, type WSet,
} from "@/lib/data";
import { eventsOn } from "@/lib/events";
import { fmtMinutes, pretty, range, diffDays, todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({ meta: [{ title: "Progress — 30-Day Transformation" }, { name: "description", content: "Independent analytics for every area of your 30-day challenge." }, { property: "og:title", content: "Progress — 30-Day Transformation" }, { property: "og:description", content: "Independent analytics for every area of your 30-day challenge." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
type Cell = "good" | "partial" | "bad" | "none";

function Page() {
  const { challenge, length } = useChallenge();
  const start = challenge?.start_date ?? todayStr();
  const end = challenge?.end_date ?? todayStr();
  const t = todayStr();
  const days = range(start, length);
  const past = days.filter((d) => d <= t);
  type RB = { gte: (c: string, v: string) => { lte: (c: string, v: string) => unknown } };
  const r = (b: RB, col: string) => b.gte(col, start).lte(col, end);
  const k = [start, end];

  const habits = useRows<Habit>("habits", (b) => b.eq("archived", false).order("sort")).data ?? [];
  const hLogs = useRows<HabitLog>("habit_logs", (b) => r(b, "log_date"), k).data ?? [];
  const rules = useRows<AbstRule>("abstinence_rules", (b) => b.eq("archived", false).order("sort")).data ?? [];
  const aLogs = useRows<AbstLog>("abstinence_logs", (b) => r(b, "log_date"), k).data ?? [];
  const limits = useRows<Limit>("limits", (b) => b.eq("archived", false).order("sort")).data ?? [];
  const lLogs = useRows<LimitLog>("limit_logs", (b) => r(b, "log_date"), k).data ?? [];
  const sessions = useRows<Session>("workout_sessions", (b) => r(b, "session_date"), k).data ?? [];
  const sets = useRows<WSet>("workout_sets").data ?? [];
  const exs = useRows<Exercise>("workout_exercises", (b) => b.order("sort")).data ?? [];
  const study = useRows<StudySession>("study_sessions", (b) => r(b, "session_date"), k).data ?? [];
  const hifz = useRows<HifzLog>("hifz_logs", (b) => r(b, "log_date"), k).data ?? [];
  const reading = useRows<ReadingLog>("reading_logs", (b) => r(b, "log_date"), k).data ?? [];
  const events = useRows<CalEvent>("calendar_events").data ?? [];
  const actuals = useRows<EventActual>("event_actuals", (b) => r(b, "occurrence_date"), k).data ?? [];
  const journal = useRows<Journal>("journal_entries", (b) => r(b, "entry_date"), k).data ?? [];
  const { subjects, topics, workouts, books } = useOptions();

  // Habits
  const required = habits.filter((h) => !h.is_optional);
  const habitDay = (d: string): Cell => {
    const due = required.filter((h) => h.frequency_type !== "weekly_target" && isHabitDue(h, d));
    if (!due.length) return "none";
    const done = due.filter((h) => hLogs.some((l) => l.habit_id === h.id && l.log_date === d && l.completed)).length;
    return done === due.length ? "good" : done ? "partial" : "bad";
  };
  // Abstain
  const abstDay = (d: string): Cell => {
    const ls = aLogs.filter((l) => l.log_date === d);
    if (!ls.length) return "none";
    return ls.some((l) => l.status === "incident") ? "bad" : ls.length >= rules.length ? "good" : "partial";
  };
  // Limits
  const limitDay = (d: string): Cell => {
    const ls = lLogs.filter((l) => l.log_date === d);
    if (!ls.length) return "none";
    return ls.every((l) => l.minutes <= (limits.find((x) => x.id === l.limit_id)?.daily_limit_minutes ?? Infinity)) ? "good" : "bad";
  };
  const done = sessions.filter((s) => s.completed);
  const planned = (d: string) => eventsOn(events, d).filter((e) => e.kind !== "task");
  const plannedTotal = sum(past.map((d) => planned(d).length));
  const actDone = actuals.filter((a) => a.status === "done").length;
  const actPartial = actuals.filter((a) => a.status === "partial").length;

  const rows: { label: string; fn: (d: string) => Cell }[] = [
    { label: "Habits", fn: habitDay },
    { label: "Abstain", fn: abstDay },
    { label: "Limits", fn: limitDay },
    { label: "Workout", fn: (d) => (done.some((s) => s.session_date === d) ? "good" : "none") },
    { label: "Study", fn: (d) => (study.some((s) => s.session_date === d) ? "good" : "none") },
    { label: "Hifz", fn: (d) => (hifz.some((h) => h.log_date === d) ? "good" : "none") },
    { label: "Reading", fn: (d) => (reading.some((x) => x.log_date === d) ? "good" : "none") },
    { label: "Journal", fn: (d) => (journal.some((j) => j.entry_date === d) ? "good" : "none") },
  ];
  const cellCls: Record<Cell, string> = { good: "bg-success", partial: "bg-warning", bad: "bg-destructive", none: "bg-muted" };

  const studyTotal = sum(study.map((s) => s.duration_minutes));
  const hifzTotal = sum(hifz.map((h) => h.ayahs));
  const pagesTotal = sum(reading.map((x) => x.pages));
  const pastWeeks = Math.max(1, past.length / 7);

  return (
    <>
      <PageHeader title="Progress" subtitle={`${pretty(start)} – ${pretty(end)} · each area measured on its own`} />
      <Panel title="30-day heatmap" className="mb-4">
        <div className="overflow-x-auto">
          <table className="text-xs">
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="pr-3 py-0.5 text-muted-foreground whitespace-nowrap">{row.label}</td>
                  {days.map((d) => (
                    <td key={d} className="p-[2px]"><div title={`${row.label} · ${pretty(d)}`} className={cn("h-4 w-4 rounded-sm", d > t ? "bg-muted/40" : cellCls[row.fn(d)])} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Green: done/clean/within limit · amber: partial · red: incident, over limit or missed · grey: not logged.</p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Habits">
          {habits.length ? habits.map((h) => {
            const n = hLogs.filter((l) => l.habit_id === h.id && l.completed).length;
            const due = h.frequency_type === "weekly_target" ? Math.round((h.weekly_target ?? 1) * pastWeeks) : past.filter((d) => isHabitDue(h, d)).length;
            return <Row key={h.id} label={`${h.name}${h.is_optional ? " (optional)" : ""}`} value={`${n}/${due} · ${pct(n, due)}`} ratio={due ? n / due : 0} />;
          }) : <Empty>No habits.</Empty>}
        </Panel>

        <Panel title="Abstain consistency">
          {rules.map((ru) => {
            const ls = aLogs.filter((l) => l.rule_id === ru.id);
            const clean = ls.filter((l) => l.status === "clean").length;
            const inc = ls.length - clean;
            return <Row key={ru.id} label={ru.name} value={`${clean} clean · ${inc} incident${inc === 1 ? "" : "s"}`} ratio={past.length ? clean / past.length : 0} />;
          })}
          <p className="mt-2 text-xs text-muted-foreground">Incidents are recorded honestly and never reset the challenge.</p>
        </Panel>

        <Panel title="Limit compliance">
          {limits.map((li) => {
            const ls = lLogs.filter((l) => l.limit_id === li.id);
            const ok = ls.filter((l) => l.minutes <= li.daily_limit_minutes).length;
            return <Row key={li.id} label={`${li.name} (${li.daily_limit_minutes}m/day)`} value={`${ok}/${ls.length} within · avg ${ls.length ? Math.round(sum(ls.map((l) => l.minutes)) / ls.length) : 0}m`} ratio={ls.length ? ok / ls.length : 0} />;
          })}
        </Panel>

        <Panel title="Workouts">
          <div className="mb-3 grid grid-cols-2 gap-2"><Stat label="Sessions" value={done.length} /><Stat label="Per week" value={(done.length / pastWeeks).toFixed(1)} /></div>
          {workouts.filter((w) => !w.archived).map((w) => <Row key={w.id} label={w.name} value={`${done.filter((s) => s.workout_id === w.id).length}×`} ratio={0} bare />)}
        </Panel>

        <Panel title="HSPU progression">
          {exs.filter((e) => !e.archived && workouts.find((w) => w.id === e.workout_id)?.tracking === "progressive").map((e) => {
            const hist = sessions.filter((s) => s.workout_id === e.workout_id).sort((a, b) => a.session_date.localeCompare(b.session_date))
              .map((s) => ({ d: s.session_date, best: Math.max(0, ...sets.filter((x) => x.session_id === s.id && x.exercise_id === e.id).map((x) => Number(x.value))) }))
              .filter((x) => x.best > 0);
            const top = Math.max(1, ...hist.map((h) => h.best));
            return (
              <div key={e.id} className="mb-3">
                <div className="flex justify-between text-sm"><span>{e.name}</span><span className="tabular text-muted-foreground">{hist.length ? `${hist[0]?.best} → ${hist[hist.length - 1]?.best} ${e.unit ?? ""}` : "no data"}</span></div>
                <div className="mt-1 flex h-8 items-end gap-0.5">{hist.map((h) => <div key={h.d} title={`${pretty(h.d)}: ${h.best}`} className="w-2 rounded-t bg-chart-2" style={{ height: `${(h.best / top) * 100}%` }} />)}</div>
              </div>
            );
          })}
        </Panel>

        <Panel title="Study by subject & topic">
          <p className="mb-2 font-display text-2xl tabular">{fmtMinutes(studyTotal)} <span className="text-sm text-muted-foreground">· {fmtMinutes(studyTotal / Math.max(1, past.length))}/day</span></p>
          {subjects.map((s) => {
            const m = sum(study.filter((x) => x.subject_id === s.id).map((x) => x.duration_minutes));
            if (!m) return null;
            return (
              <div key={s.id} className="mb-2">
                <Row label={s.name} value={fmtMinutes(m)} ratio={m / Math.max(1, studyTotal)} />
                {topics.filter((tp) => tp.subject_id === s.id).map((tp) => {
                  const tm = sum(study.filter((x) => x.topic_id === tp.id).map((x) => x.duration_minutes));
                  return tm ? <p key={tp.id} className="ml-3 flex justify-between text-xs text-muted-foreground"><span>{tp.name}</span><span className="tabular">{fmtMinutes(tm)}</span></p> : null;
                })}
              </div>
            );
          })}
          {!studyTotal && <Empty>No study recorded yet.</Empty>}
        </Panel>

        <Panel title="Hifz">
          <div className="mb-3 grid grid-cols-3 gap-2"><Stat label="Ayahs" value={hifzTotal} /><Stat label="Days logged" value={hifz.length} /><Stat label="Avg/day" value={(hifzTotal / Math.max(1, past.length)).toFixed(1)} /></div>
          <Bars values={past.map((d) => sum(hifz.filter((h) => h.log_date === d).map((h) => h.ayahs)))} />
        </Panel>

        <Panel title="Reading">
          <div className="mb-3 grid grid-cols-2 gap-2"><Stat label="Pages" value={pagesTotal} /><Stat label="Avg/day" value={(pagesTotal / Math.max(1, past.length)).toFixed(1)} /></div>
          <Bars values={past.map((d) => sum(reading.filter((x) => x.log_date === d).map((x) => x.pages)))} />
          {books.map((b) => { const p = sum(reading.filter((x) => x.book_id === b.id).map((x) => x.pages)); return p ? <Row key={b.id} label={b.title} value={`${p} pages`} ratio={b.total_pages ? p / b.total_pages : 0} bare={!b.total_pages} /> : null; })}
        </Panel>

        <Panel title="Planned vs actual">
          <div className="grid grid-cols-3 gap-2"><Stat label="Planned blocks" value={plannedTotal} /><Stat label="Done" value={actDone} hint={pct(actDone, plannedTotal)} /><Stat label="Partial" value={actPartial} /></div>
          <p className="mt-2 text-xs text-muted-foreground">{actuals.filter((a) => a.status === "skipped").length} skipped · {actuals.filter((a) => a.status === "moved").length} moved · {Math.max(0, plannedTotal - actuals.length)} not recorded</p>
        </Panel>

        <Panel title="Journal">
          <div className="grid grid-cols-2 gap-2"><Stat label="Entries" value={journal.length} /><Stat label="Frequency" value={pct(journal.length, past.length)} hint="of days so far" /></div>
        </Panel>
      </div>
      {challenge && <Baseline challengeId={challenge.id} day={diffDays(t, start) + 1} />}
    </>
  );
}

function Row({ label, value, ratio, bare }: { label: ReactNode; value: ReactNode; ratio: number; bare?: boolean }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between gap-2 text-sm"><span className="truncate">{label}</span><span className="shrink-0 tabular text-muted-foreground">{value}</span></div>
      {!bare && <div className="mt-1 h-1.5 rounded bg-muted"><div className="h-1.5 rounded bg-primary" style={{ width: `${Math.min(100, ratio * 100)}%` }} /></div>}
    </div>
  );
}

function Bars({ values }: { values: number[] }) {
  const top = Math.max(1, ...values);
  return <div className="flex h-16 items-end gap-0.5">{values.map((v, i) => <div key={i} title={String(v)} className="flex-1 rounded-t bg-chart-1" style={{ height: `${Math.max(2, (v / top) * 100)}%` }} />)}</div>;
}

function Baseline({ challengeId, day }: { challengeId: string; day: number }) {
  const q = useRows<Metric>("review_metrics", (b) => b.eq("challenge_id", challengeId).order("sort"), [challengeId]);
  const { update } = useCrud("review_metrics");
  return (
    <Panel title="Day 1 baseline vs Day 30 review" className="mt-4">
      <p className="mb-3 text-xs text-muted-foreground">Optional. Fill the baseline early, the review at the end (you're on day {day}).</p>
      <div className="grid gap-2">
        <div className="grid grid-cols-[1fr_120px_120px] gap-2 text-xs text-muted-foreground"><span>Metric</span><span>Day 1</span><span>Day 30</span></div>
        {(q.data ?? []).map((m) => (
          <div key={m.id} className="grid grid-cols-[1fr_120px_120px] items-center gap-2 text-sm">
            <span>{m.metric}</span>
            <Input defaultValue={m.baseline_value ?? ""} onBlur={(e) => e.target.value !== (m.baseline_value ?? "") && update.mutate({ id: m.id, baseline_value: e.target.value || null })} />
            <Input defaultValue={m.final_value ?? ""} onBlur={(e) => e.target.value !== (m.final_value ?? "") && update.mutate({ id: m.id, final_value: e.target.value || null })} />
          </div>
        ))}
      </div>
    </Panel>
  );
}
