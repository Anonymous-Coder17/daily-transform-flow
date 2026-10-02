import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCrud, useOptions, type CalEvent, type EventActual, type Task } from "@/lib/data";
import { hhmm, pretty } from "@/lib/dates";
import { KIND_LABEL } from "@/lib/events";

const sel = "h-9 w-full rounded-md border bg-card px-2 text-sm";

export type EventDraft = Partial<CalEvent> & { event_date: string };

export function EventDialog({ draft, onClose }: { draft: EventDraft | null; onClose: () => void }) {
  const { insert, update, remove } = useCrud("calendar_events");
  const { subjects, workouts } = useOptions();
  const [f, setF] = useState<EventDraft>({ event_date: "" });
  useEffect(() => { if (draft) setF({ kind: "event", recurrence: "none", ...draft }); }, [draft]);
  const set = (k: keyof CalEvent, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    const row = {
      title: f.title?.trim() || KIND_LABEL[f.kind ?? "event"],
      kind: f.kind, event_date: f.event_date,
      start_time: f.start_time || null, end_time: f.end_time || null,
      recurrence: f.recurrence, recurrence_until: f.recurrence !== "none" ? f.recurrence_until || null : null,
      description: f.description || null,
      subject_id: f.kind === "study" ? f.subject_id || null : null,
      workout_id: f.kind === "workout" ? f.workout_id || null : null,
    };
    const done = { onSuccess: onClose };
    if (f.id) update.mutate({ id: f.id, ...row }, done); else insert.mutate(row, done);
  }

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-display text-2xl">{f.id ? "Edit plan" : "Plan a block"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-5 gap-1 rounded-lg bg-muted p-1">
            {(["event", "study", "workout", "task", "other"] as const).map((k) => (
              <button type="button" key={k} onClick={() => set("kind", k)} className={`rounded-md py-1.5 text-xs font-medium ${f.kind === k ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                {k[0]!.toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
          <div className="space-y-1"><Label>Title</Label><Input autoFocus value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder={KIND_LABEL[f.kind ?? "event"]} /></div>
          {f.kind === "study" && (
            <div className="space-y-1"><Label>Subject</Label>
              <select className={sel} value={f.subject_id ?? ""} onChange={(e) => set("subject_id", e.target.value)}>
                <option value="">Any subject</option>{subjects.filter((s) => !s.archived).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
          )}
          {f.kind === "workout" && (
            <div className="space-y-1"><Label>Workout</Label>
              <select className={sel} value={f.workout_id ?? ""} onChange={(e) => set("workout_id", e.target.value)}>
                <option value="">Choose…</option>{workouts.filter((w) => !w.archived).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select></div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1"><Label>Date</Label><Input type="date" required value={f.event_date} onChange={(e) => set("event_date", e.target.value)} /></div>
            <div className="space-y-1"><Label>Start</Label><Input type="time" value={hhmm(f.start_time)} onChange={(e) => set("start_time", e.target.value)} /></div>
            <div className="space-y-1"><Label>End</Label><Input type="time" value={hhmm(f.end_time)} onChange={(e) => set("end_time", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label>Repeat</Label>
              <select className={sel} value={f.recurrence ?? "none"} onChange={(e) => set("recurrence", e.target.value)}>
                <option value="none">Does not repeat</option><option value="daily">Every day</option><option value="weekdays">Weekdays (Mon–Fri)</option><option value="weekly">Weekly</option>
              </select></div>
            {f.recurrence !== "none" && <div className="space-y-1"><Label>Until (optional)</Label><Input type="date" value={f.recurrence_until ?? ""} onChange={(e) => set("recurrence_until", e.target.value)} /></div>}
          </div>
          <div className="space-y-1"><Label>Notes</Label><Textarea rows={2} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
          <DialogFooter className="gap-2 sm:justify-between">
            {f.id ? <Button type="button" variant="ghost" className="text-destructive" onClick={() => { if (confirm(f.recurrence !== "none" ? "Delete this event and all its repeats?" : "Delete this event?")) remove.mutate(f.id!, { onSuccess: onClose }); }}><Trash2 className="mr-1 h-4 w-4" />Delete</Button> : <span />}
            <Button type="submit" disabled={insert.isPending || update.isPending}>Save plan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ActualDialog({ target, onClose }: { target: { event: CalEvent; date: string; actual?: EventActual } | null; onClose: () => void }) {
  const { upsert, remove } = useCrud("event_actuals");
  const [status, setStatus] = useState("done");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    if (!target) return;
    const a = target.actual;
    setStatus(a?.status ?? "done");
    setStart(hhmm(a?.actual_start ?? target.event.start_time));
    setEnd(hhmm(a?.actual_end ?? target.event.end_time));
    setNote(a?.note ?? "");
  }, [target]);
  if (!target) return null;
  const opts = [["done", "Done as planned"], ["partial", "Partially"], ["moved", "Moved"], ["skipped", "Skipped"]] as const;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="font-display text-2xl">What actually happened?</DialogTitle></DialogHeader>
        <p className="-mt-2 text-sm text-muted-foreground">{target.event.title} · {pretty(target.date)}{target.event.start_time && ` · planned ${hhmm(target.event.start_time)}–${hhmm(target.event.end_time)}`}</p>
        <div className="grid grid-cols-2 gap-2">
          {opts.map(([k, l]) => (
            <button key={k} onClick={() => setStatus(k)} className={`rounded-lg border px-3 py-2 text-sm ${status === k ? "border-primary bg-primary/10 font-medium" : ""}`}>{l}</button>
          ))}
        </div>
        {status !== "skipped" && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label>Actual start</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div className="space-y-1"><Label>Actual end</Label><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
        )}
        <div className="space-y-1"><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></div>
        <DialogFooter className="gap-2 sm:justify-between">
          {target.actual ? <Button variant="ghost" onClick={() => remove.mutate(target.actual!.id, { onSuccess: onClose })}>Clear record</Button> : <span />}
          <Button onClick={() => upsert.mutate({
            row: { event_id: target.event.id, occurrence_date: target.date, status, actual_start: status === "skipped" ? null : start || null, actual_end: status === "skipped" ? null : end || null, note: note || null },
            onConflict: "event_id,occurrence_date",
          }, { onSuccess: onClose })}>Save actual</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type TaskDraft = Partial<Task>;
export function TaskDialog({ draft, onClose }: { draft: TaskDraft | null; onClose: () => void }) {
  const { insert, update, remove } = useCrud("tasks");
  const [f, setF] = useState<TaskDraft>({});
  useEffect(() => { if (draft) setF({ priority: 2, ...draft }); }, [draft]);
  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="font-display text-2xl">{f.id ? "Edit task" : "New task"}</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault();
          const row = { title: f.title?.trim() || "Untitled task", due_date: f.due_date || null, notes: f.notes || null, priority: Number(f.priority ?? 2) };
          if (f.id) update.mutate({ id: f.id, ...row }, { onSuccess: onClose }); else insert.mutate(row, { onSuccess: onClose });
        }}>
          <div className="space-y-1"><Label>Task</Label><Input autoFocus required value={f.title ?? ""} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label>Due</Label><Input type="date" value={f.due_date ?? ""} onChange={(e) => setF({ ...f, due_date: e.target.value })} /></div>
            <div className="space-y-1"><Label>Priority</Label>
              <select className={sel} value={f.priority ?? 2} onChange={(e) => setF({ ...f, priority: Number(e.target.value) })}>
                <option value={1}>High</option><option value={2}>Normal</option><option value={3}>Low</option>
              </select></div>
          </div>
          <div className="space-y-1"><Label>Notes</Label><Textarea rows={2} value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          <DialogFooter className="gap-2 sm:justify-between">
            {f.id ? <Button type="button" variant="ghost" className="text-destructive" onClick={() => remove.mutate(f.id!, { onSuccess: onClose })}><Trash2 className="mr-1 h-4 w-4" />Delete</Button> : <span />}
            <Button type="submit">Save task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
