import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { endOfMonth, startOfMonth, format } from "date-fns";
import { CalendarPlus, CheckSquare, ChevronLeft, ChevronRight, Copy, NotebookPen, Plus, Sparkles, Timer, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Panel, Empty } from "@/components/kit";
import { EventDialog, ActualDialog, TaskDialog, type EventDraft, type TaskDraft } from "@/components/calendar-dialogs";
import { HabitsToday, AbstainToday, LimitsToday, HifzQuick, ReadingQuick, StudyToday, WorkoutToday, useScheduledWorkout } from "@/components/trackers";
import { useRows, useCrud, useChallenge, type CalEvent, type EventActual, type Task } from "@/lib/data";
import { eventsOn, KIND_DOT, KIND_LABEL } from "@/lib/events";
import { diffDays, fmtTime, parse, pretty, range, shift, todayStr, tomorrowStr, weekStart, ymd } from "@/lib/dates";
import { cn } from "@/lib/utils";

type View = "day" | "week" | "month";

export const Route = createFileRoute("/_authenticated/calendar")({
  validateSearch: (s: Record<string, unknown>): { date?: string; view?: View } => ({
    date: typeof s.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.date) ? s.date : undefined,
    view: s.view === "week" || s.view === "month" ? s.view : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Calendar — 30-Day Transformation" },
      { name: "description", content: "Plan tomorrow, record today: calendar, planned vs actual, and daily tracking." },
      { property: "og:title", content: "Calendar — 30-Day Transformation" },
      { property: "og:description", content: "Your daily plan, actuals and quick tracking in one place." },
    ],
  }),
  component: CalendarPage,
});

const STATUS: Record<string, { label: string; cls: string }> = {
  done: { label: "Done", cls: "bg-success/15 text-success" },
  partial: { label: "Partial", cls: "bg-warning/20 text-warning-foreground dark:text-warning" },
  moved: { label: "Moved", cls: "bg-planned/15 text-planned" },
  skipped: { label: "Skipped", cls: "bg-muted text-muted-foreground" },
};

function CalendarPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/calendar" });
  const date = search.date ?? todayStr();
  const view: View = search.view ?? "day";
  const go = (d: string, v: View = view) => navigate({ search: { date: d === todayStr() ? undefined : d, view: v === "day" ? undefined : v } });

  const [eventDraft, setEventDraft] = useState<EventDraft | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null);
  const [actualTarget, setActualTarget] = useState<{ event: CalEvent; date: string; actual?: EventActual } | null>(null);

  const events = useRows<CalEvent>("calendar_events", (b) => b.order("start_time"));
  const { challenge, length } = useChallenge();
  const today = todayStr();
  const isFuture = date > today;
  const cDay = challenge ? diffDays(date, challenge.start_date) + 1 : null;

  const stepBy = view === "day" ? 1 : view === "week" ? 7 : 30;

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {cDay && cDay >= 1 && cDay <= length ? `Day ${cDay} of ${length}` : date === today ? "Today" : isFuture ? "Upcoming" : "Past"}
          </p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl">
            {view === "month" ? format(parse(date), "MMMM yyyy") : view === "week" ? `Week of ${pretty(weekStart(date), "MMM d")}` : date === today ? "Today" : date === tomorrowStr() ? "Tomorrow" : pretty(date, "EEEE")}
          </h1>
          {view === "day" && <p className="text-sm text-muted-foreground">{pretty(date, "EEEE, MMMM d, yyyy")}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => go(tomorrowStr(), "day")} className="rounded-full"><Sparkles className="mr-1.5 h-4 w-4" />Plan tomorrow</Button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" onClick={() => go(shift(date, -stepBy))} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="icon" variant="outline" onClick={() => go(shift(date, stepBy))} aria-label="Next"><ChevronRight className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => go(today)} disabled={date === today}>Today</Button>
          <input type="date" value={date} onChange={(e) => e.target.value && go(e.target.value)} className="h-9 rounded-md border bg-card px-2 text-sm" aria-label="Jump to date" />
        </div>
        <div className="grid grid-cols-3 rounded-lg bg-muted p-1 text-sm">
          {(["day", "week", "month"] as const).map((v) => (
            <button key={v} onClick={() => go(date, v)} className={cn("rounded-md px-4 py-1.5 font-medium capitalize", view === v ? "bg-card shadow-sm" : "text-muted-foreground")}>{v}</button>
          ))}
        </div>
      </div>

      {view === "day" && (
        <DayView
          date={date} events={events.data ?? []} isFuture={isFuture}
          onAdd={(d) => setEventDraft({ event_date: date, ...d })} onEdit={(e) => setEventDraft(e)}
          onRecord={(event, actual) => setActualTarget({ event, date, actual })}
          onTask={(t) => setTaskDraft(t)}
        />
      )}
      {view === "week" && <WeekView date={date} events={events.data ?? []} onPick={(d) => go(d, "day")} />}
      {view === "month" && <MonthView date={date} events={events.data ?? []} onPick={(d) => go(d, "day")} challengeStart={challenge?.start_date} challengeEnd={challenge?.end_date} />}

      <EventDialog draft={eventDraft} onClose={() => setEventDraft(null)} />
      <TaskDialog draft={taskDraft} onClose={() => setTaskDraft(null)} />
      <ActualDialog target={actualTarget} onClose={() => setActualTarget(null)} />
    </div>
  );
}

function DayView({ date, events, isFuture, onAdd, onEdit, onRecord, onTask }: {
  date: string; events: CalEvent[]; isFuture: boolean;
  onAdd: (d?: Partial<CalEvent>) => void; onEdit: (e: CalEvent) => void;
  onRecord: (e: CalEvent, a?: EventActual) => void; onTask: (t: TaskDraft) => void;
}) {
  const today = todayStr();
  const list = eventsOn(events, date);
  const actuals = useRows<EventActual>("event_actuals", (b) => b.eq("occurrence_date", date), [date]);
  const tasks = useRows<Task>("tasks", (b) => b.order("priority").order("created_at"));
  const { update: updTask } = useCrud("tasks");
  const dayTasks = (tasks.data ?? []).filter((t) => t.due_date === date || (date === today && !t.done && t.due_date && t.due_date < today));
  const inbox = (tasks.data ?? []).filter((t) => !t.due_date && !t.done);
  const recorded = list.filter((e) => actuals.data?.some((a) => a.event_id === e.id)).length;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        {isFuture && <PlanPanel date={date} events={events} />}

        <Panel
          title={<span>Plan <span className="font-normal text-muted-foreground">· {list.length} block{list.length === 1 ? "" : "s"}{!isFuture && list.length ? ` · ${recorded} recorded` : ""}</span></span>}
          action={<Button size="sm" variant="outline" onClick={() => onAdd()}><Plus className="mr-1 h-4 w-4" />Add</Button>}
        >
          {!list.length ? (
            <Empty>{isFuture ? "Nothing planned yet. Add blocks above or here." : "No planned blocks for this day."}</Empty>
          ) : (
            <ol className="relative space-y-2 border-l pl-4">
              {list.map((e) => {
                const a = actuals.data?.find((x) => x.event_id === e.id);
                return (
                  <li key={e.id} className="relative">
                    <span className={cn("absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full ring-4 ring-card", KIND_DOT[e.kind])} />
                    <div className="rounded-lg border bg-surface/50 p-3">
                      <div className="flex items-start gap-3">
                        <button className="min-w-0 flex-1 text-left" onClick={() => onEdit(e)}>
                          <p className="font-medium">{e.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            <span className="text-planned">Planned</span> {e.start_time ? `${fmtTime(e.start_time)}${e.end_time ? `–${fmtTime(e.end_time)}` : ""}` : "anytime"} · {KIND_LABEL[e.kind]}
                            {e.recurrence !== "none" && ` · repeats ${e.recurrence}`}
                          </p>
                          {a && a.status !== "skipped" && (a.actual_start || a.actual_end) && (
                            <p className="text-xs text-muted-foreground"><span className="text-actual">Actual</span> {fmtTime(a.actual_start)}{a.actual_end && `–${fmtTime(a.actual_end)}`}</p>
                          )}
                          {a?.note && <p className="mt-1 text-xs italic text-muted-foreground">{a.note}</p>}
                        </button>
                        {date <= today ? (
                          a ? (
                            <button onClick={() => onRecord(e, a)} className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-medium", STATUS[a.status]?.cls)}>{STATUS[a.status]?.label}</button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={() => onRecord(e)}>Record</Button>
                          )
                        ) : <span className="shrink-0 rounded-full bg-planned/10 px-2.5 py-1 text-xs text-planned">Planned</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>

        <Panel title="Tasks" action={<Button size="sm" variant="outline" onClick={() => onTask({ due_date: date })}><Plus className="mr-1 h-4 w-4" />Task</Button>}>
          <QuickTask date={date} />
          {!dayTasks.length && !inbox.length ? <p className="mt-2 text-sm text-muted-foreground">No tasks for this day.</p> : (
            <ul className="mt-3 space-y-1">
              {[...dayTasks, ...inbox].map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-md px-1 py-1.5 hover:bg-muted/60">
                  <Checkbox checked={t.done} onCheckedChange={(c) => updTask.mutate({ id: t.id, done: !!c, done_at: c ? new Date().toISOString() : null })} />
                  <button onClick={() => onTask(t)} className={cn("flex-1 text-left text-sm", t.done && "text-muted-foreground line-through")}>
                    {t.priority === 1 && <span className="mr-1.5 text-destructive">!</span>}{t.title}
                  </button>
                  <span className="text-xs text-muted-foreground">{!t.due_date ? "Inbox" : t.due_date < date ? `Overdue · ${pretty(t.due_date, "MMM d")}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <QuickActions date={date} />
      </div>

      <div className="space-y-5">
        <WorkoutToday date={date} />
        <HabitsToday date={date} compact />
        <div id="abstain"><AbstainToday date={date} /></div>
        <LimitsToday date={date} />
        <StudyToday date={date} />
        <div id="hifz"><HifzQuick date={date} /></div>
        <div id="reading"><ReadingQuick date={date} /></div>
      </div>
    </div>
  );
}

function QuickTask({ date }: { date: string }) {
  const [t, setT] = useState("");
  const { insert } = useCrud("tasks");
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!t.trim()) return; insert.mutate({ title: t.trim(), due_date: date }, { onSuccess: () => setT("") }); }}>
      <Input value={t} onChange={(e) => setT(e.target.value)} placeholder="Add a task for this day…" className="h-9" />
      <Button size="sm" type="submit" variant="secondary">Add</Button>
    </form>
  );
}

function PlanPanel({ date, events }: { date: string; events: CalEvent[] }) {
  const { insert } = useCrud("calendar_events");
  const { workout } = useScheduledWorkout(date);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("study");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const planned = eventsOn(events, date);
  const prevDay = shift(date, -1);
  const copyable = events.filter((e) => e.recurrence === "none" && e.event_date === prevDay);
  const hasWorkoutBlock = planned.some((e) => e.kind === "workout");

  return (
    <section className="panel border-primary/30 bg-primary/5 p-4 md:p-5">
      <div className="flex items-center gap-2"><CalendarPlus className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Planning {pretty(date, "EEEE")}</h2></div>
      <p className="mt-1 text-xs text-muted-foreground">Decide before the day begins. Later, record what actually happened.</p>
      <form className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]" onSubmit={(e) => {
        e.preventDefault();
        insert.mutate({ title: title.trim() || KIND_LABEL[kind], kind, event_date: date, start_time: start || null, end_time: end || null }, { onSuccess: () => { setTitle(""); setStart(""); setEnd(""); } });
      }}>
        <Input className="col-span-2 h-9 sm:col-span-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Linear Algebra ch. 3" />
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-9 rounded-md border bg-card px-2 text-sm">
          {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <Input type="time" className="h-9" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Start" />
        <Input type="time" className="h-9" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="End" />
        <Button size="sm" type="submit" className="h-9">Add block</Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {workout && !hasWorkoutBlock && (
          <Button size="sm" variant="outline" onClick={() => insert.mutate({ title: workout.name, kind: "workout", workout_id: workout.id, event_date: date })}>
            <Dumbbell className="mr-1 h-3.5 w-3.5" />Add scheduled {workout.name}
          </Button>
        )}
        {copyable.length > 0 && (
          <Button size="sm" variant="outline" onClick={async () => {
            for (const e of copyable) await insert.mutateAsync({ title: e.title, kind: e.kind, event_date: date, start_time: e.start_time, end_time: e.end_time, subject_id: e.subject_id, workout_id: e.workout_id, description: e.description });
            toast.success(`Copied ${copyable.length} block(s)`);
          }}>
            <Copy className="mr-1 h-3.5 w-3.5" />Copy {copyable.length} block(s) from {pretty(prevDay, "EEE")}
          </Button>
        )}
      </div>
    </section>
  );
}

function QuickActions({ date }: { date: string }) {
  const scroll = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  const btn = "flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-xs font-medium hover:border-primary/50";
  return (
    <Panel title="Quick actions">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        <Link to="/study" className={btn}><Timer className="h-5 w-5 text-chart-1" />Study timer</Link>
        <button onClick={() => scroll("hifz")} className={btn}><span className="font-display text-lg leading-5 text-chart-3">۞</span>Hifz</button>
        <button onClick={() => scroll("reading")} className={btn}><CheckSquare className="h-5 w-5 text-chart-2" />Reading</button>
        <button onClick={() => scroll("abstain")} className={btn}><span className="text-lg leading-5 text-destructive">●</span>Distraction</button>
        <Link to="/journal" search={{ date }} className={btn}><NotebookPen className="h-5 w-5 text-chart-5" />Journal</Link>
      </div>
    </Panel>
  );
}

function WeekView({ date, events, onPick }: { date: string; events: CalEvent[]; onPick: (d: string) => void }) {
  const days = range(weekStart(date), 7);
  const actuals = useRows<EventActual>("event_actuals", (b) => b.gte("occurrence_date", days[0]).lte("occurrence_date", days[6]), [days[0]]);
  const today = todayStr();
  return (
    <div className="grid gap-2 md:grid-cols-7">
      {days.map((d) => {
        const list = eventsOn(events, d);
        return (
          <button key={d} onClick={() => onPick(d)} className={cn("panel min-h-32 p-3 text-left transition-colors hover:border-primary/50", d === today && "border-primary/60")}>
            <p className="text-xs text-muted-foreground">{pretty(d, "EEE")}</p>
            <p className={cn("font-display text-xl", d === today && "text-primary")}>{pretty(d, "d")}</p>
            <ul className="mt-2 space-y-1">
              {list.map((e) => {
                const a = actuals.data?.find((x) => x.event_id === e.id && x.occurrence_date === d);
                return (
                  <li key={e.id} className="flex items-center gap-1.5 text-xs">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", KIND_DOT[e.kind])} />
                    <span className={cn("truncate", a?.status === "skipped" && "line-through text-muted-foreground")}>{e.start_time && <span className="text-muted-foreground">{fmtTime(e.start_time)} </span>}{e.title}</span>
                    {a && a.status !== "skipped" && <span className="ml-auto text-success">✓</span>}
                  </li>
                );
              })}
              {!list.length && <li className="text-xs text-muted-foreground">—</li>}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

function MonthView({ date, events, onPick, challengeStart, challengeEnd }: { date: string; events: CalEvent[]; onPick: (d: string) => void; challengeStart?: string; challengeEnd?: string }) {
  const first = ymd(startOfMonth(parse(date)));
  const last = ymd(endOfMonth(parse(date)));
  const gridStart = weekStart(first);
  const cells = useMemo(() => range(gridStart, Math.ceil((diffDays(last, gridStart) + 1) / 7) * 7), [gridStart, last]);
  const today = todayStr();
  return (
    <div className="panel overflow-hidden">
      <div className="grid grid-cols-7 border-b text-center text-xs text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d) => {
          const list = eventsOn(events, d);
          const inMonth = d >= first && d <= last;
          const inChallenge = challengeStart && challengeEnd && d >= challengeStart && d <= challengeEnd;
          return (
            <button key={d} onClick={() => onPick(d)} className={cn("min-h-16 border-b border-r p-1.5 text-left hover:bg-muted/50 md:min-h-24", !inMonth && "opacity-40", inChallenge && "bg-primary/5")}>
              <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs", d === today && "bg-primary text-primary-foreground")}>{pretty(d, "d")}</span>
              <div className="mt-1 hidden space-y-0.5 md:block">
                {list.slice(0, 3).map((e) => <p key={e.id} className="truncate text-[11px]"><span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", KIND_DOT[e.kind])} />{e.title}</p>)}
                {list.length > 3 && <p className="text-[11px] text-muted-foreground">+{list.length - 3} more</p>}
              </div>
              <div className="mt-1 flex gap-0.5 md:hidden">{list.slice(0, 4).map((e) => <span key={e.id} className={cn("h-1.5 w-1.5 rounded-full", KIND_DOT[e.kind])} />)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
