import { useEffect, useState } from "react";
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Panel, Empty } from "@/components/kit";
import { freqLabel } from "@/components/trackers";
import {
  useRows, useCrud, useOptions, type TableName,
  type Habit, type AbstRule, type Limit, type Workout, type Exercise, type ScheduleRow, type Topic,
} from "@/lib/data";
import { WEEKDAYS } from "@/lib/dates";
import { cn } from "@/lib/utils";

const sel = "h-9 w-full rounded-md border bg-card px-2 text-sm";

/* ---------- Habits ---------- */
type HabitDraft = Partial<Habit>;
export function HabitDialog({ draft, onClose }: { draft: HabitDraft | null; onClose: () => void }) {
  const { insert, update } = useCrud("habits");
  const [f, setF] = useState<HabitDraft>({});
  useEffect(() => { if (draft) setF({ frequency_type: "daily", tracking_type: "completion", weekdays: [], ...draft }); }, [draft]);
  const days = f.weekdays ?? [];
  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader><DialogTitle className="font-display text-2xl">{f.id ? "Edit habit" : "New habit"}</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault();
          const row = {
            name: f.name?.trim() || "Habit", description: f.description || null,
            frequency_type: f.frequency_type, weekdays: f.frequency_type === "weekdays" ? days : [],
            weekly_target: f.frequency_type === "weekly_target" ? Number(f.weekly_target || 1) : null,
            custom_rule: f.frequency_type === "custom" ? f.custom_rule || null : null,
            tracking_type: f.tracking_type, target_value: f.tracking_type === "completion" ? null : f.target_value ? Number(f.target_value) : null,
            unit: f.tracking_type === "count" ? f.unit || null : null, is_optional: !!f.is_optional,
          };
          if (f.id) update.mutate({ id: f.id, ...row }, { onSuccess: onClose }); else insert.mutate(row, { onSuccess: onClose });
        }}>
          <div className="space-y-1"><Label>Name</Label><Input autoFocus required value={f.name ?? ""} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1"><Label>Frequency</Label>
            <select className={sel} value={f.frequency_type} onChange={(e) => setF({ ...f, frequency_type: e.target.value })}>
              <option value="daily">Daily</option><option value="weekdays">Selected weekdays</option><option value="weekly_target">Weekly target</option><option value="custom">Custom</option>
            </select></div>
          {f.frequency_type === "weekdays" && (
            <div className="flex flex-wrap gap-1">{WEEKDAYS.map((d, i) => (
              <button type="button" key={d} onClick={() => setF({ ...f, weekdays: days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort() })}
                className={cn("rounded-md border px-2.5 py-1 text-xs", days.includes(i) && "border-primary bg-primary text-primary-foreground")}>{d}</button>
            ))}</div>
          )}
          {f.frequency_type === "weekly_target" && <div className="space-y-1"><Label>Times per week</Label><Input type="number" min={1} max={7} value={f.weekly_target ?? 1} onChange={(e) => setF({ ...f, weekly_target: Number(e.target.value) })} /></div>}
          {f.frequency_type === "custom" && <div className="space-y-1"><Label>Rule (description)</Label><Input value={f.custom_rule ?? ""} onChange={(e) => setF({ ...f, custom_rule: e.target.value })} placeholder="e.g. every other day" /></div>}
          <div className="space-y-1"><Label>Tracking</Label>
            <select className={sel} value={f.tracking_type} onChange={(e) => setF({ ...f, tracking_type: e.target.value })}>
              <option value="completion">Completion (done / not done)</option><option value="count">Count</option><option value="duration">Duration (minutes)</option>
            </select></div>
          {f.tracking_type !== "completion" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Daily target</Label><Input type="number" min={0} value={f.target_value ?? ""} onChange={(e) => setF({ ...f, target_value: e.target.value === "" ? null : Number(e.target.value) })} /></div>
              {f.tracking_type === "count" && <div className="space-y-1"><Label>Unit</Label><Input value={f.unit ?? ""} onChange={(e) => setF({ ...f, unit: e.target.value })} placeholder="glasses, pages…" /></div>}
            </div>
          )}
          <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">Optional habit<Switch checked={!!f.is_optional} onCheckedChange={(c) => setF({ ...f, is_optional: c })} /></label>
          <DialogFooter><Button type="submit">Save habit</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function HabitManager() {
  const habits = useRows<Habit>("habits", (b) => b.order("archived").order("sort"));
  const { update } = useCrud("habits");
  const [draft, setDraft] = useState<HabitDraft | null>(null);
  return (
    <Panel title="Manage habits" action={<Button size="sm" variant="outline" onClick={() => setDraft({ sort: (habits.data?.length ?? 0) + 1 })}><Plus className="mr-1 h-4 w-4" />Habit</Button>}>
      {!habits.data?.length ? <Empty>No habits yet.</Empty> : (
        <ul className="divide-y">
          {habits.data.map((h) => (
            <li key={h.id} className={cn("flex items-center gap-2 py-2", h.archived && "opacity-50")}>
              <div className="flex-1"><p className="text-sm font-medium">{h.name}</p><p className="text-xs text-muted-foreground">{freqLabel(h)} · {h.tracking_type}{h.is_optional ? " · optional" : ""}{h.archived ? " · archived" : ""}</p></div>
              <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setDraft(h)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={h.archived ? "Restore" : "Archive"} onClick={() => update.mutate({ id: h.id, archived: !h.archived })}>{h.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button>
            </li>
          ))}
        </ul>
      )}
      <HabitDialog draft={draft} onClose={() => setDraft(null)} />
    </Panel>
  );
}

/* ---------- Simple named lists (abstain, limits, books, subjects) ---------- */
type Field = { key: string; label: string; type?: "number" | "text"; width?: string };
type NamedRow = { id: string; archived: boolean; [k: string]: unknown };

export function ListManager({ title, table, nameKey = "name", fields = [], order = "sort", extraInsert = {}, hint }: {
  title: string; table: TableName; nameKey?: string; fields?: Field[]; order?: string; extraInsert?: Record<string, unknown>; hint?: string;
}) {
  const rows = useRows<NamedRow>(table, (b) => b.order("archived").order(order), ["manage"]);
  const { insert, update } = useCrud(table);
  const [name, setName] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const all = [{ key: nameKey, label: "Name" }, ...fields];
  const toRow = (src: Record<string, string>) => Object.fromEntries(all.map((f) => [f.key, f.type === "number" ? (src[f.key] ? Number(src[f.key]) : null) : src[f.key] || null]));

  return (
    <Panel title={title}>
      {hint && <p className="-mt-1 mb-3 text-xs text-muted-foreground">{hint}</p>}
      <ul className="divide-y">
        {(rows.data ?? []).map((r) => (
          <li key={r.id} className={cn("flex flex-wrap items-center gap-2 py-2", r.archived && "opacity-50")}>
            {editing === r.id ? (
              <form className="flex flex-1 flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); update.mutate({ id: r.id, ...toRow(edit) }, { onSuccess: () => setEditing(null) }); }}>
                {all.map((f) => <Input key={f.key} className={cn("h-8", f.width ?? "flex-1")} type={f.type ?? "text"} placeholder={f.label} value={edit[f.key] ?? ""} onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value })} />)}
                <Button size="sm" type="submit">Save</Button><Button size="sm" variant="ghost" type="button" onClick={() => setEditing(null)}>Cancel</Button>
              </form>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-sm font-medium">{String(r[nameKey] ?? "")}</p>
                  {fields.length > 0 && <p className="text-xs text-muted-foreground">{fields.map((f) => r[f.key] != null && r[f.key] !== "" ? `${f.label}: ${String(r[f.key])}` : null).filter(Boolean).join(" · ")}{r.archived ? " · archived" : ""}</p>}
                </div>
                <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setEditing(r.id); setEdit(Object.fromEntries(all.map((f) => [f.key, r[f.key] == null ? "" : String(r[f.key])]))); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label={r.archived ? "Restore" : "Archive"} onClick={() => update.mutate({ id: r.id, archived: !r.archived })}>{r.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button>
              </>
            )}
          </li>
        ))}
      </ul>
      <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        insert.mutate({ ...extraInsert, ...toRow({ ...extra, [nameKey]: name.trim() }), ...(order === "sort" ? { sort: (rows.data?.length ?? 0) + 1 } : {}) }, { onSuccess: () => { setName(""); setExtra({}); } });
      }}>
        <Input className="h-9 min-w-40 flex-1" placeholder={`Add ${title.toLowerCase().replace(/^manage /, "")}…`} value={name} onChange={(e) => setName(e.target.value)} />
        {fields.map((f) => <Input key={f.key} className={cn("h-9", f.width ?? "w-28")} type={f.type ?? "text"} placeholder={f.label} value={extra[f.key] ?? ""} onChange={(e) => setExtra({ ...extra, [f.key]: e.target.value })} />)}
        <Button size="sm" type="submit" className="h-9"><Plus className="mr-1 h-4 w-4" />Add</Button>
      </form>
    </Panel>
  );
}

export const AbstainManager = () => <ListManager title="Abstain rules" table="abstinence_rules" hint="Complete avoidance. Log clean or incident daily — incidents never reset your challenge." />;
export const LimitManager = () => <ListManager title="Usage limits" table="limits" fields={[{ key: "daily_limit_minutes", label: "Min/day", type: "number", width: "w-24" }]} hint="Controlled usage with a daily minute budget." />;
export const BookManager = () => <ListManager title="Books" table="books" nameKey="title" order="created_at" fields={[{ key: "author", label: "Author", width: "w-32" }, { key: "total_pages", label: "Pages", type: "number", width: "w-20" }]} />;

/* ---------- Subjects & topics ---------- */
export function SubjectManager() {
  const { topics } = useOptions();
  const subjects = useRows<NamedRow & { name: string }>("subjects", (b) => b.order("sort"), ["manage"]);
  const { insert: addTopic, update: updTopic, remove: delTopic } = useCrud("topics");
  const [newTopic, setNewTopic] = useState<Record<string, string>>({});
  return (
    <div className="space-y-4">
      <ListManager title="Subjects" table="subjects" />
      <Panel title="Topics">
        {(subjects.data ?? []).filter((s) => !s.archived).map((s) => (
          <div key={s.id} className="mb-4 last:mb-0">
            <p className="mb-1.5 text-sm font-medium">{s.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {topics.filter((t: Topic) => t.subject_id === s.id).map((t) => (
                <span key={t.id} className={cn("inline-flex items-center gap-1 rounded-full border bg-surface px-2.5 py-1 text-xs", t.archived && "opacity-50 line-through")}>
                  {t.name}
                  <button aria-label="Archive topic" onClick={() => updTopic.mutate({ id: t.id, archived: !t.archived })} className="text-muted-foreground hover:text-foreground"><Archive className="h-3 w-3" /></button>
                  <button aria-label="Delete topic" onClick={() => confirm(`Delete topic ${t.name}?`) && delTopic.mutate(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = newTopic[s.id]?.trim(); if (!n) return; addTopic.mutate({ subject_id: s.id, name: n }, { onSuccess: () => setNewTopic({ ...newTopic, [s.id]: "" }) }); }}>
              <Input className="h-8" placeholder="New topic" value={newTopic[s.id] ?? ""} onChange={(e) => setNewTopic({ ...newTopic, [s.id]: e.target.value })} />
              <Button size="sm" variant="secondary" type="submit">Add</Button>
            </form>
          </div>
        ))}
      </Panel>
    </div>
  );
}

/* ---------- Workouts, exercises, schedule ---------- */
export function WorkoutManager() {
  const workouts = useRows<Workout>("workouts", (b) => b.order("archived").order("sort"), ["manage"]);
  const exercises = useRows<Exercise>("workout_exercises", (b) => b.order("sort"));
  const w = useCrud("workouts");
  const ex = useCrud("workout_exercises");
  const [name, setName] = useState("");
  const [tracking, setTracking] = useState("simple");
  const [dur, setDur] = useState("");
  const [newEx, setNewEx] = useState<Record<string, { name: string; measurement: string; unit: string }>>({});

  return (
    <Panel title="Workouts & exercises">
      <div className="space-y-4">
        {(workouts.data ?? []).map((wk) => (
          <div key={wk.id} className={cn("rounded-lg border p-3", wk.archived && "opacity-50")}>
            <div className="flex flex-wrap items-center gap-2">
              <Input className="h-8 min-w-40 flex-1 font-medium" defaultValue={wk.name} onBlur={(e) => e.target.value !== wk.name && w.update.mutate({ id: wk.id, name: e.target.value })} />
              <select className="h-8 rounded-md border bg-card px-2 text-xs" value={wk.tracking} onChange={(e) => w.update.mutate({ id: wk.id, tracking: e.target.value })}>
                <option value="simple">Completion only</option><option value="progressive">Progressive (sets)</option>
              </select>
              <Input className="h-8 w-20" type="number" placeholder="min" defaultValue={wk.duration_minutes ?? ""} onBlur={(e) => w.update.mutate({ id: wk.id, duration_minutes: e.target.value ? Number(e.target.value) : null })} />
              <Button size="icon" variant="ghost" aria-label="Archive" onClick={() => w.update.mutate({ id: wk.id, archived: !wk.archived })}>{wk.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button>
            </div>
            {wk.tracking === "progressive" && (
              <div className="mt-3 space-y-1.5 pl-1">
                {(exercises.data ?? []).filter((e) => e.workout_id === wk.id).map((e) => (
                  <div key={e.id} className={cn("flex flex-wrap items-center gap-2", e.archived && "opacity-50")}>
                    <Input className="h-8 min-w-32 flex-1" defaultValue={e.name} onBlur={(ev) => ev.target.value !== e.name && ex.update.mutate({ id: e.id, name: ev.target.value })} />
                    <select className="h-8 rounded-md border bg-card px-2 text-xs" value={e.measurement} onChange={(ev) => ex.update.mutate({ id: e.id, measurement: ev.target.value })}>
                      {["reps", "time", "weight", "distance", "custom"].map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <Input className="h-8 w-20" placeholder="unit" defaultValue={e.unit ?? ""} onBlur={(ev) => ex.update.mutate({ id: e.id, unit: ev.target.value || null })} />
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Archive exercise" onClick={() => ex.update.mutate({ id: e.id, archived: !e.archived })}>{e.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}</Button>
                  </div>
                ))}
                <form className="flex flex-wrap gap-2 pt-1" onSubmit={(ev) => {
                  ev.preventDefault();
                  const n = newEx[wk.id];
                  if (!n?.name.trim()) return;
                  ex.insert.mutate({ workout_id: wk.id, name: n.name.trim(), measurement: n.measurement || "reps", unit: n.unit || null, target_sets: 3, sort: 99 }, { onSuccess: () => setNewEx({ ...newEx, [wk.id]: { name: "", measurement: "reps", unit: "" } }) });
                }}>
                  <Input className="h-8 min-w-32 flex-1" placeholder="New exercise" value={newEx[wk.id]?.name ?? ""} onChange={(ev) => setNewEx({ ...newEx, [wk.id]: { measurement: "reps", unit: "", ...newEx[wk.id], name: ev.target.value } })} />
                  <select className="h-8 rounded-md border bg-card px-2 text-xs" value={newEx[wk.id]?.measurement ?? "reps"} onChange={(ev) => setNewEx({ ...newEx, [wk.id]: { name: "", unit: "", ...newEx[wk.id], measurement: ev.target.value } })}>
                    {["reps", "time", "weight", "distance", "custom"].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <Button size="sm" variant="secondary" type="submit">Add exercise</Button>
                </form>
              </div>
            )}
          </div>
        ))}
        <form className="flex flex-wrap gap-2" onSubmit={(e) => {
          e.preventDefault(); if (!name.trim()) return;
          w.insert.mutate({ name: name.trim(), tracking, duration_minutes: dur ? Number(dur) : null, sort: (workouts.data?.length ?? 0) + 1 }, { onSuccess: () => { setName(""); setDur(""); } });
        }}>
          <Input className="h-9 min-w-40 flex-1" placeholder="New workout" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="h-9 rounded-md border bg-card px-2 text-sm" value={tracking} onChange={(e) => setTracking(e.target.value)}><option value="simple">Completion only</option><option value="progressive">Progressive</option></select>
          <Input className="h-9 w-20" type="number" placeholder="min" value={dur} onChange={(e) => setDur(e.target.value)} />
          <Button size="sm" type="submit" className="h-9"><Plus className="mr-1 h-4 w-4" />Add</Button>
        </form>
      </div>
    </Panel>
  );
}

export function ScheduleEditor() {
  const schedule = useRows<ScheduleRow>("workout_schedule");
  const { workouts } = useOptions();
  const { upsert } = useCrud("workout_schedule");
  const order = [1, 2, 3, 4, 5, 6, 0];
  const count = order.filter((d) => schedule.data?.find((s) => s.weekday === d)?.workout_id).length;
  return (
    <Panel title="Weekly schedule" action={<span className="text-xs text-muted-foreground">{count} workout day{count === 1 ? "" : "s"} / week</span>}>
      <div className="grid gap-2 sm:grid-cols-7">
        {order.map((d) => {
          const row = schedule.data?.find((s) => s.weekday === d);
          return (
            <div key={d} className="rounded-lg border bg-surface/50 p-2">
              <p className="text-xs font-medium text-muted-foreground">{WEEKDAYS[d]}</p>
              <select className="mt-1 h-8 w-full rounded-md border bg-card px-1 text-xs" value={row?.workout_id ?? ""}
                onChange={(e) => upsert.mutate({ row: { weekday: d, workout_id: e.target.value || null }, onConflict: "user_id,weekday" })}>
                <option value="">Rest</option>
                {workouts.filter((w) => !w.archived).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
