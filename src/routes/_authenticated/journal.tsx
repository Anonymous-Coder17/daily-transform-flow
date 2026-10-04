import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel, Empty, DateNav } from "@/components/kit";
import { useCrud, useRows, type Journal } from "@/lib/data";
import { pretty, todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Journal — 30-Day Transformation" }, { name: "description", content: "Daily journal with optional review prompts." }, { property: "og:title", content: "Journal — 30-Day Transformation" }, { property: "og:description", content: "Daily journal with optional review prompts." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

const PROMPTS = [
  ["went_well", "What went well?"],
  ["went_wrong", "What went wrong?"],
  ["biggest_distraction", "Biggest distraction"],
  ["change_tomorrow", "What will I change tomorrow?"],
] as const;
type Field = "content" | (typeof PROMPTS)[number][0];
const EMPTY: Record<Field, string> = { content: "", went_well: "", went_wrong: "", biggest_distraction: "", change_tomorrow: "" };

function Page() {
  const [date, setDate] = useState(todayStr());
  const [search, setSearch] = useState("");
  const all = useRows<Journal>("journal_entries", (b) => b.order("entry_date", { ascending: false }));
  const { insert, update, remove } = useCrud("journal_entries");
  const entries = all.data ?? [];
  const entry = entries.find((e) => e.entry_date === date);
  const [form, setForm] = useState(EMPTY);
  useEffect(() => {
    setForm(entry ? { content: entry.content ?? "", went_well: entry.went_well ?? "", went_wrong: entry.went_wrong ?? "", biggest_distraction: entry.biggest_distraction ?? "", change_tomorrow: entry.change_tomorrow ?? "" } : EMPTY);
  }, [entry?.id, date]); // eslint-disable-line react-hooks/exhaustive-deps

  function save() {
    const row = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() || null]));
    if (entry) update.mutate({ id: entry.id, ...row, updated_at: new Date().toISOString() }, { onSuccess: () => toast.success("Entry updated") });
    else insert.mutate({ entry_date: date, ...row }, { onSuccess: () => toast.success("Entry saved") });
  }
  const s = search.toLowerCase();
  const results = entries.filter((e) => !s || [e.content, e.went_well, e.went_wrong, e.biggest_distraction, e.change_tomorrow].some((x) => x?.toLowerCase().includes(s)));

  return (
    <>
      <PageHeader title="Journal" subtitle="Optional. Write when it helps." />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel title={pretty(date, "EEEE, MMMM d")} action={<DateNav date={date} onChange={setDate} />}>
          <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Free-form thoughts…" className="min-h-40" />
          <p className="mt-4 mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Review prompts (optional)</p>
          <div className="grid gap-3 md:grid-cols-2">
            {PROMPTS.map(([k, label]) => (
              <label key={k} className="text-sm">
                <span className="mb-1 block text-muted-foreground">{label}</span>
                <Textarea value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="min-h-20" />
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={save}>{entry ? "Update" : "Save"}</Button>
            {entry && <Button variant="ghost" className="text-destructive" onClick={() => remove.mutate(entry.id, { onSuccess: () => toast.success("Entry deleted") })}>Delete</Button>}
          </div>
        </Panel>
        <Panel title={`Entries (${entries.length})`}>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entries…" className="mb-3" />
          {results.length ? (
            <ul className="max-h-[60vh] space-y-1 overflow-auto">{results.map((e) => (
              <li key={e.id}>
                <button onClick={() => setDate(e.entry_date)} className={cn("w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted", e.entry_date === date && "bg-muted")}>
                  <p className="font-medium">{pretty(e.entry_date)}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{e.content || e.went_well || e.change_tomorrow || "—"}</p>
                </button>
              </li>
            ))}</ul>
          ) : <Empty>{search ? "No matches." : "No entries yet."}</Empty>}
        </Panel>
      </div>
    </>
  );
}
