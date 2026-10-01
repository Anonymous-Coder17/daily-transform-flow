import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pretty, shift, todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel p-4 md:p-5", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl tabular">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

export function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const t = todayStr();
  return (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" onClick={() => onChange(shift(date, -1))} aria-label="Previous day"><ChevronLeft className="h-4 w-4" /></Button>
      <input type="date" value={date} onChange={(e) => e.target.value && onChange(e.target.value)} className="rounded-md border bg-card px-2 py-1.5 text-sm" aria-label="Date" />
      <Button size="icon" variant="ghost" onClick={() => onChange(shift(date, 1))} aria-label="Next day"><ChevronRight className="h-4 w-4" /></Button>
      {date !== t && <Button size="sm" variant="outline" onClick={() => onChange(t)}>Today</Button>}
      <span className="ml-1 hidden text-sm text-muted-foreground sm:inline">{pretty(date)}</span>
    </div>
  );
}

export function Dots({ values }: { values: ("done" | "miss" | "none" | "bad" | "partial")[] }) {
  const cls = { done: "bg-success", miss: "bg-muted", none: "bg-transparent border", bad: "bg-destructive", partial: "bg-warning" };
  return <div className="flex gap-1">{values.map((v, i) => <span key={i} className={cn("h-2.5 w-2.5 rounded-full", cls[v])} />)}</div>;
}
