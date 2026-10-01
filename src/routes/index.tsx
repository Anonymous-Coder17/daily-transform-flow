import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "30-Day Transformation — Plan, Execute, Record, Review" },
      { name: "description", content: "A private planner and tracker for a 30-day personal transformation: calendar, habits, training, study, Hifz, reading and journal." },
      { property: "og:title", content: "30-Day Transformation" },
      { property: "og:description", content: "Plan tomorrow, record today, review honestly. A calm private tracker for 30 days of change." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/calendar", replace: true });
    });
  }, [navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Plan · Execute · Record · Review · Adjust</p>
      <h1 className="mt-6 max-w-2xl font-display text-5xl leading-tight text-foreground sm:text-6xl">30-Day Transformation</h1>
      <p className="mt-5 max-w-md text-muted-foreground">
        Plan tomorrow tonight. Record what actually happened. Review without judgment, and adjust.
      </p>
      <Button asChild size="lg" className="mt-10 rounded-full px-8">
        <Link to="/auth">Sign in to begin</Link>
      </Button>
    </main>
  );
}
