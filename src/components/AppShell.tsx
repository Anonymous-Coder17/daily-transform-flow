import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { CalendarDays, Repeat, Dumbbell, BookOpen, LineChart, NotebookPen, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useChallenge } from "@/lib/data";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/calendar", label: "Calendar", short: "Today", icon: CalendarDays },
  { to: "/habits", label: "Habits & Routines", short: "Habits", icon: Repeat },
  { to: "/training", label: "Training", short: "Train", icon: Dumbbell },
  { to: "/study", label: "Study", short: "Study", icon: BookOpen },
  { to: "/progress", label: "Progress", short: "Progress", icon: LineChart },
  { to: "/journal", label: "Journal", short: "Journal", icon: NotebookPen },
] as const;

export function AppShell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const seeded = useRef(false);
  const { challenge, day, length, rawDay } = useChallenge();

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    supabase.rpc("seed_defaults").then(({ data }) => {
      if (data) qc.invalidateQueries();
    });
  }, [qc]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const pct = Math.min(100, Math.max(0, (Math.min(rawDay, length) / length) * 100));

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar px-4 py-6 md:flex">
        <Link to="/calendar" className="px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">Plan · Record · Review</p>
          <p className="mt-1 font-display text-xl leading-tight">{challenge?.title ?? "30-Day Transformation"}</p>
        </Link>
        <div className="mx-2 mt-4">
          <div className="flex justify-between text-xs text-muted-foreground"><span>{rawDay < 1 ? `Starts in ${1 - rawDay}d` : `Day ${day} of ${length}`}</span><span>{Math.round(pct)}%</span></div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground" activeProps={{ className: "!bg-sidebar-accent !text-sidebar-foreground" }}>
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t pt-4">
          <Link to="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent" activeProps={{ className: "!bg-sidebar-accent !text-sidebar-foreground" }}>
            <Settings className="h-4 w-4" />Settings
          </Link>
          <button onClick={signOut} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4" />Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/85 px-4 py-3 backdrop-blur md:hidden">
        <div>
          <p className="font-display text-lg leading-none">{challenge?.title ?? "30-Day Transformation"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{rawDay < 1 ? `Starts in ${1 - rawDay} days` : `Day ${day} of ${length}`}</p>
        </div>
        <Link to="/settings" aria-label="Settings" className="rounded-full p-2 text-muted-foreground hover:bg-muted"><Settings className="h-5 w-5" /></Link>
      </header>

      <main className="pb-28 md:pb-10 md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8"><Outlet /></div>
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-background/95 pt-1.5 backdrop-blur md:hidden">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className={cn("flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-muted-foreground")} activeProps={{ className: "!text-primary" }}>
            <n.icon className="h-5 w-5" />{n.short}
          </Link>
        ))}
      </nav>
    </div>
  );
}
