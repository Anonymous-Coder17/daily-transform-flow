import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, DateNav, Dots, Stat, Empty } from "@/components/kit";
import { HabitsToday, AbstainToday, LimitsToday, HifzQuick, ReadingQuick, isHabitDue } from "@/components/trackers";
import { HabitManager, AbstainManager, LimitManager, BookManager } from "@/components/manage";
import { useRows, useCrud, useOptions, sum, type Habit, type HabitLog, type AbstRule, type AbstLog, type Limit, type LimitLog, type HifzLog, type ReadingLog } from "@/lib/data";
import { lastNDays, pretty, shift, todayStr, weekStart } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/habits")({
  head: () => ({
    meta: [
      { title: "Habits & Routines — 30-Day Transformation" },
      { name: "description", content: "Habits, abstain rules, usage limits, Hifz and reading." },
      { property: "og:title", content: "Habits & Routines — 30-Day Transformation" },
      { property: "og:description", content: "Track habits, distractions, Hifz and reading day by day." },
    ],
  }),
  component: HabitsPage,
});

function HabitsPage() {
  const [date, setDate] = useState(todayStr());
  return (
    <>
      <PageHeader title="Habits & Routines" subtitle="Record honestly. Consistency over perfection."><DateNav date={date} onChange={setDate} /></PageHeader>
      <Tabs defaultValue="habits">
        <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-1 sm:w-auto">
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="abstain">Abstain</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="hifz">Hifz</TabsTrigger>
          <TabsTrigger value="reading">Reading</TabsTrigger>
        </TabsList>
        <TabsContent value="habits" className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5"><HabitsToday date={date} /><HabitConsistency /></div>
          <HabitManager />
        </TabsContent>
        <TabsContent value="abstain" className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5"><AbstainToday date={date} /><AbstainConsistency /></div>
          <AbstainManager />
        </TabsContent>
        <TabsContent value="limits" className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5"><LimitsToday date={date} /><LimitConsistency /></div>
          <LimitManager />
        </TabsContent>
        <TabsContent value="hifz" className="space-y-5"><HifzQuick date={date} /><HifzHistory /></TabsContent>
        <TabsContent value="reading" className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5"><ReadingQuick date={date} /><ReadingHistory /></div>
          <BookManager />
        </TabsContent>
      </Tabs>
    </>
  );
}

const D30 = () => lastNDays(30);

function HabitConsistency() {
  const days = D30();
  const habits = useRows<Habit>("habits", (b) => b.eq("archived", false).order("sort"));
  const logs = useRows<HabitLog>("habit_logs", (b) => b.gte("log_date", days[0]), ["30d"]);
  const week = lastNDays(7);
  return (
    <Panel title="Consistency">
      {!habits.data?.length ? <Empty>No habits.</Empty> : (
        <ul className="space-y-3">
          {habits.data.map((h) => {
            const done = new Set((logs.data ?? []).filter((l) => l.habit_id === h.id && l.completed).map((l) => l.log_date));
            let monthPct: string;
            if (h.frequency_type === "weekly_target") {
              const thisWeek = [...done].filter((d) => d >= weekStart(todayStr())).length;
              monthPct = `${thisWeek}/${h.weekly_target ?? 1} this week · ${done.size} in 30d`;
            } else {
              const due = days.filter((d) => isHabitDue(h, d)).length || 1;
              monthPct = `${Math.round((done.size / due) * 100)}% of due days (30d)`;
            }
            return (
              <li key={h.id} className="flex items-center justify-between gap-3">
                <div><p className="text-sm font-medium">{h.name}</p><p className="text-xs text-muted-foreground">{monthPct}</p></div>
                <Dots values={week.map((d) => (done.has(d) ? "done" : isHabitDue(h, d) && h.frequency_type !== "weekly_target" ? "miss" : "none"))} />
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">Dots show the last 7 days.</p>
    </Panel>
  );
}

function AbstainConsistency() {
  const days = D30();
  const rules = useRows<AbstRule>("abstinence_rules", (b) => b.eq("archived", false).order("sort"));
  const logs = useRows<AbstLog>("abstinence_logs", (b) => b.gte("log_date", days[0]), ["30d"]);
  const week = lastNDays(7);
  return (
    <Panel title="Last 30 days">
      <ul className="space-y-3">
        {(rules.data ?? []).map((r) => {
          const mine = (logs.data ?? []).filter((l) => l.rule_id === r.id);
          const clean = mine.filter((l) => l.status === "clean").length;
          const inc = mine.filter((l) => l.status === "incident").length;
          return (
            <li key={r.id} className="flex items-center justify-between gap-3">
              <div><p className="text-sm font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{clean} clean · {inc} incident{inc === 1 ? "" : "s"} · {30 - clean - inc} unlogged</p></div>
              <Dots values={week.map((d) => { const s = mine.find((l) => l.log_date === d)?.status; return s === "clean" ? "done" : s === "incident" ? "bad" : "none"; })} />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function LimitConsistency() {
  const days = D30();
  const limits = useRows<Limit>("limits", (b) => b.eq("archived", false).order("sort"));
  const logs = useRows<LimitLog>("limit_logs", (b) => b.gte("log_date", days[0]), ["30d"]);
  const week = lastNDays(7);
  return (
    <Panel title="Last 30 days">
      <ul className="space-y-3">
        {(limits.data ?? []).map((l) => {
          const mine = (logs.data ?? []).filter((x) => x.limit_id === l.id);
          const within = mine.filter((x) => x.minutes <= l.daily_limit_minutes).length;
          const avg = mine.length ? Math.round(sum(mine.map((x) => x.minutes)) / mine.length) : 0;
          return (
            <li key={l.id} className="flex items-center justify-between gap-3">
              <div><p className="text-sm font-medium">{l.name}</p><p className="text-xs text-muted-foreground">Within limit {within}/{mine.length} logged days · avg {avg} min</p></div>
              <Dots values={week.map((d) => { const x = mine.find((m) => m.log_date === d); return !x ? "none" : x.minutes <= l.daily_limit_minutes ? "done" : "bad"; })} />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function HifzHistory() {
  const logs = useRows<HifzLog>("hifz_logs", (b) => b.order("log_date", { ascending: false }).limit(120), ["hist"]);
  const { remove } = useCrud("hifz_logs");
  const list = logs.data ?? [];
  const t = todayStr();
  const week = sum(list.filter((l) => l.log_date >= weekStart(t)).map((l) => l.ayahs));
  const month = sum(list.filter((l) => l.log_date.slice(0, 7) === t.slice(0, 7)).map((l) => l.ayahs));
  const last30 = sum(list.filter((l) => l.log_date >= shift(t, -29)).map((l) => l.ayahs));
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="This week" value={week} hint="ayahs" />
        <Stat label="This month" value={month} hint="ayahs" />
        <Stat label="Last 30 days" value={last30} hint={`${(last30 / 30).toFixed(1)}/day avg`} />
      </div>
      <Panel title="History">
        {!list.length ? <Empty>No Hifz entries yet.</Empty> : (
          <ul className="divide-y">
            {list.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                <span>{pretty(l.log_date, "EEE, MMM d")}</span>
                <span className="flex items-center gap-2"><span className="tabular font-medium">{l.ayahs} ayahs</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Delete" onClick={() => remove.mutate(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button></span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

function ReadingHistory() {
  const { books } = useOptions();
  const logs = useRows<ReadingLog>("reading_logs", (b) => b.order("log_date", { ascending: false }).order("created_at", { ascending: false }).limit(200), ["hist"]);
  const { remove } = useCrud("reading_logs");
  const list = logs.data ?? [];
  const t = todayStr();
  const week = sum(list.filter((l) => l.log_date >= weekStart(t)).map((l) => l.pages));
  const month = sum(list.filter((l) => l.log_date.slice(0, 7) === t.slice(0, 7)).map((l) => l.pages));
  const l30 = list.filter((l) => l.log_date >= shift(t, -29));
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="This week" value={week} hint="pages" />
        <Stat label="This month" value={month} hint="pages" />
        <Stat label="30-day avg" value={(sum(l30.map((l) => l.pages)) / 30).toFixed(1)} hint="pages/day" />
      </div>
      <Panel title="By book">
        <ul className="space-y-2">
          {books.map((b) => {
            const p = sum(list.filter((l) => l.book_id === b.id).map((l) => l.pages));
            return (
              <li key={b.id} className="text-sm">
                <div className="flex justify-between"><span className={b.archived ? "text-muted-foreground" : ""}>{b.title}</span><span className="tabular">{p}{b.total_pages ? ` / ${b.total_pages}` : ""} pages</span></div>
                {b.total_pages ? <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-chart-2" style={{ width: `${Math.min(100, (p / b.total_pages) * 100)}%` }} /></div> : null}
              </li>
            );
          })}
        </ul>
      </Panel>
      <Panel title="Recent entries">
        {!list.length ? <Empty>No reading logged yet.</Empty> : (
          <ul className="divide-y">
            {list.slice(0, 40).map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                <span>{pretty(l.log_date, "MMM d")} · <span className="text-muted-foreground">{books.find((b) => b.id === l.book_id)?.title}</span></span>
                <span className="flex items-center gap-2"><span className="tabular">{l.pages} p</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Delete" onClick={() => remove.mutate(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button></span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
