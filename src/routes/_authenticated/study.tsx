import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Play, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel, Empty, DateNav, Stat } from "@/components/kit";
import { SubjectManager } from "@/components/manage";
import { sum, useCrud, useOptions, useRows, type StudySession } from "@/lib/data";
import { fmtMinutes, pretty, shift, todayStr, weekStart } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/study")({
  head: () => ({ meta: [{ title: "Study — 30-Day Transformation" }, { name: "description", content: "Study timer, manual sessions and subject/topic totals." }, { property: "og:title", content: "Study — 30-Day Transformation" }, { property: "og:description", content: "Study timer, manual sessions and subject/topic totals." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

const KEY = "study-timer";
type TimerState = { start: number; subject: string; topic: string };

function SubjectTopic({ subject, topic, onSubject, onTopic }: { subject: string; topic: string; onSubject: (v: string) => void; onTopic: (v: string) => void }) {
  const { subjects, topics } = useOptions();
  return (
    <div className="flex flex-wrap gap-2">
      <select value={subject} onChange={(e) => { onSubject(e.target.value); onTopic(""); }} className="rounded-md border bg-card px-2 py-2 text-sm" aria-label="Subject">
        <option value="">Subject…</option>
        {subjects.filter((s) => !s.archived).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <select value={topic} onChange={(e) => onTopic(e.target.value)} className="rounded-md border bg-card px-2 py-2 text-sm" aria-label="Topic">
        <option value="">Topic (optional)</option>
        {topics.filter((t) => t.subject_id === subject && !t.archived).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </div>
  );
}

function Page() {
  const [date, setDate] = useState(todayStr());
  return (
    <>
      <PageHeader title="Study" subtitle="Time real focus, by subject and topic." />
      <Tabs defaultValue="log">
        <TabsList className="mb-4"><TabsTrigger value="log">Timer & log</TabsTrigger><TabsTrigger value="stats">Totals</TabsTrigger><TabsTrigger value="subjects">Subjects</TabsTrigger></TabsList>
        <TabsContent value="log" className="space-y-4">
          <Timer />
          <div><DateNav date={date} onChange={setDate} /></div>
          <Manual date={date} />
          <DayList date={date} />
        </TabsContent>
        <TabsContent value="stats"><Totals /></TabsContent>
        <TabsContent value="subjects"><SubjectManager /></TabsContent>
      </Tabs>
    </>
  );
}

function Timer() {
  const [state, setState] = useState<TimerState | null>(null);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [now, setNow] = useState(Date.now());
  const { insert } = useCrud("study_sessions");
  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw) as TimerState; setState(s); setSubject(s.subject); setTopic(s.topic); }
  }, []);
  useEffect(() => { if (!state) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [state]);
  const elapsed = state ? Math.floor((now - state.start) / 1000) : 0;
  const clock = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  function start() {
    if (!subject) return toast.error("Choose a subject first");
    const s = { start: Date.now(), subject, topic };
    localStorage.setItem(KEY, JSON.stringify(s)); setState(s); setNow(Date.now());
  }
  function stop() {
    if (!state) return;
    const mins = Math.max(1, Math.round((Date.now() - state.start) / 60000));
    insert.mutate({ subject_id: state.subject, topic_id: state.topic || null, session_date: todayStr(), started_at: new Date(state.start).toISOString(), ended_at: new Date().toISOString(), duration_minutes: mins, source: "timer" }, { onSuccess: () => toast.success(`Saved ${fmtMinutes(mins)}`) });
    localStorage.removeItem(KEY); setState(null);
  }
  function discard() { localStorage.removeItem(KEY); setState(null); }

  return (
    <Panel title="Timer">
      <div className="flex flex-wrap items-center gap-4">
        <p className="font-mono text-4xl tabular">{clock}</p>
        {state ? (
          <div className="flex gap-2"><Button onClick={stop}><Square className="mr-1 h-4 w-4" />Stop & save</Button><Button variant="ghost" onClick={discard}>Discard</Button></div>
        ) : (
          <>
            <SubjectTopic subject={subject} topic={topic} onSubject={setSubject} onTopic={setTopic} />
            <Button onClick={start}><Play className="mr-1 h-4 w-4" />Start</Button>
          </>
        )}
      </div>
      {state && <p className="mt-2 text-xs text-muted-foreground">Keeps running if you close the app.</p>}
    </Panel>
  );
}

function Manual({ date }: { date: string }) {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [mins, setMins] = useState("");
  const [notes, setNotes] = useState("");
  const { insert } = useCrud("study_sessions");
  function add() {
    if (!subject || !Number(mins)) return toast.error("Subject and minutes are required");
    insert.mutate({ subject_id: subject, topic_id: topic || null, session_date: date, duration_minutes: Number(mins), notes: notes || null, source: "manual" }, { onSuccess: () => { setMins(""); setNotes(""); toast.success("Session added"); } });
  }
  return (
    <Panel title={`Add session · ${pretty(date)}`}>
      <div className="flex flex-wrap items-center gap-2">
        <SubjectTopic subject={subject} topic={topic} onSubject={setSubject} onTopic={setTopic} />
        <Input type="number" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value)} placeholder="Minutes" className="w-24" />
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="min-w-40 flex-1" />
        <Button onClick={add}>Add</Button>
      </div>
    </Panel>
  );
}

function DayList({ date }: { date: string }) {
  const { subjects, topics } = useOptions();
  const q = useRows<StudySession>("study_sessions", (b) => b.eq("session_date", date).order("created_at"), [date]);
  const { remove, update } = useCrud("study_sessions");
  const list = q.data ?? [];
  return (
    <Panel title="Sessions" action={<span className="text-sm tabular">{fmtMinutes(sum(list.map((s) => s.duration_minutes)))}</span>}>
      {list.length ? (
        <ul className="divide-y text-sm">{list.map((s) => (
          <li key={s.id} className="flex items-center gap-2 py-2">
            <div className="flex-1">
              <p>{subjects.find((x) => x.id === s.subject_id)?.name}{s.topic_id ? <span className="text-muted-foreground"> · {topics.find((t) => t.id === s.topic_id)?.name}</span> : null}</p>
              <p className="text-xs text-muted-foreground">{s.source === "timer" ? "Timer" : "Manual"}{s.notes ? ` · ${s.notes}` : ""}</p>
            </div>
            <Input type="number" defaultValue={s.duration_minutes} className="w-20" aria-label="Minutes" onBlur={(e) => Number(e.target.value) !== s.duration_minutes && Number(e.target.value) > 0 && update.mutate({ id: s.id, duration_minutes: Number(e.target.value) })} />
            <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}</ul>
      ) : <Empty>No sessions on this day.</Empty>}
    </Panel>
  );
}

function Totals() {
  const { subjects, topics } = useOptions();
  const t = todayStr();
  const since = shift(t, -29);
  const q = useRows<StudySession>("study_sessions", (b) => b.gte("session_date", since), [since]);
  const list = q.data ?? [];
  const wk = weekStart(t);
  const tot = (f: (s: StudySession) => boolean) => sum(list.filter(f).map((s) => s.duration_minutes));
  const week = list.filter((s) => s.session_date >= wk);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Today" value={fmtMinutes(tot((s) => s.session_date === t))} />
        <Stat label="This week" value={fmtMinutes(tot((s) => s.session_date >= wk))} />
        <Stat label="Last 30 days" value={fmtMinutes(tot(() => true))} />
      </div>
      <Panel title="This week by subject & topic">
        {week.length ? subjects.map((s) => {
          const m = sum(week.filter((x) => x.subject_id === s.id).map((x) => x.duration_minutes));
          if (!m) return null;
          const tps = [...topics.filter((tp) => tp.subject_id === s.id).map((tp) => ({ name: tp.name, m: sum(week.filter((x) => x.topic_id === tp.id).map((x) => x.duration_minutes)) })), { name: "No topic", m: sum(week.filter((x) => x.subject_id === s.id && !x.topic_id).map((x) => x.duration_minutes)) }].filter((x) => x.m);
          return (
            <div key={s.id} className="mb-3">
              <div className="flex justify-between text-sm font-medium"><span>{s.name}</span><span className="tabular">{fmtMinutes(m)}</span></div>
              {tps.map((tp) => (
                <div key={tp.name} className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-28 truncate">{tp.name}</span>
                  <div className="h-1.5 flex-1 rounded bg-muted"><div className="h-1.5 rounded bg-primary" style={{ width: `${(tp.m / m) * 100}%` }} /></div>
                  <span className="w-14 text-right tabular">{fmtMinutes(tp.m)}</span>
                </div>
              ))}
            </div>
          );
        }) : <Empty>No study this week yet.</Empty>}
      </Panel>
    </div>
  );
}
