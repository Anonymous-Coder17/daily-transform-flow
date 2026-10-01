import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { diffDays, todayStr } from "./dates";

// Loosely typed handle for generic CRUD helpers; row shapes come from Tables<>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export type TableName =
  | "challenges" | "review_metrics" | "habits" | "habit_logs" | "abstinence_rules" | "abstinence_logs"
  | "limits" | "limit_logs" | "workouts" | "workout_exercises" | "workout_schedule" | "workout_sessions"
  | "workout_sets" | "subjects" | "topics" | "study_sessions" | "hifz_logs" | "books" | "reading_logs"
  | "calendar_events" | "event_actuals" | "tasks" | "journal_entries" | "integrations";

export type Challenge = Tables<"challenges">;
export type Habit = Tables<"habits">;
export type HabitLog = Tables<"habit_logs">;
export type AbstRule = Tables<"abstinence_rules">;
export type AbstLog = Tables<"abstinence_logs">;
export type Limit = Tables<"limits">;
export type LimitLog = Tables<"limit_logs">;
export type Workout = Tables<"workouts">;
export type Exercise = Tables<"workout_exercises">;
export type ScheduleRow = Tables<"workout_schedule">;
export type Session = Tables<"workout_sessions">;
export type WSet = Tables<"workout_sets">;
export type Subject = Tables<"subjects">;
export type Topic = Tables<"topics">;
export type StudySession = Tables<"study_sessions">;
export type HifzLog = Tables<"hifz_logs">;
export type Book = Tables<"books">;
export type ReadingLog = Tables<"reading_logs">;
export type CalEvent = Tables<"calendar_events">;
export type EventActual = Tables<"event_actuals">;
export type Task = Tables<"tasks">;
export type Journal = Tables<"journal_entries">;
export type Metric = Tables<"review_metrics">;

type Builder = (q: any) => any; // eslint-disable-line @typescript-eslint/no-explicit-any

export function useRows<T>(table: TableName, build?: Builder, deps: unknown[] = []) {
  return useQuery({
    queryKey: [table, ...deps],
    queryFn: async () => {
      let q = db.from(table).select("*");
      if (build) q = build(q);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

async function run(p: PromiseLike<{ error: unknown; data?: unknown }>) {
  const { data, error } = await p;
  if (error) throw error;
  return data;
}

export function useCrud(table: TableName, also: TableName[] = []) {
  const qc = useQueryClient();
  const onSuccess = () => [table, ...also].forEach((t) => qc.invalidateQueries({ queryKey: [t] }));
  const onError = (e: unknown) => toast.error((e as { message?: string })?.message ?? "Something went wrong");
  const insert = useMutation({ mutationFn: (row: Record<string, unknown>) => run(db.from(table).insert(row).select().single()), onSuccess, onError });
  const update = useMutation({ mutationFn: ({ id, ...row }: Record<string, unknown>) => run(db.from(table).update(row).eq("id", id)), onSuccess, onError });
  const remove = useMutation({ mutationFn: (id: string) => run(db.from(table).delete().eq("id", id)), onSuccess, onError });
  const upsert = useMutation({
    mutationFn: ({ row, onConflict }: { row: Record<string, unknown>; onConflict: string }) =>
      run(db.from(table).upsert(row, { onConflict })),
    onSuccess, onError,
  });
  return { insert, update, remove, upsert };
}

export function useChallenge() {
  const q = useRows<Challenge>("challenges", (b) => b.eq("is_active", true).order("created_at", { ascending: false }).limit(1));
  const c = q.data?.[0];
  const length = c ? diffDays(c.end_date, c.start_date) + 1 : 30;
  const day = c ? diffDays(todayStr(), c.start_date) + 1 : 1;
  return { ...q, challenge: c, length, day: Math.max(1, Math.min(day, length)), started: day >= 1, rawDay: day };
}

export function useOptions() {
  const subjects = useRows<Subject>("subjects", (b) => b.order("sort"));
  const topics = useRows<Topic>("topics", (b) => b.order("sort"));
  const workouts = useRows<Workout>("workouts", (b) => b.order("sort"));
  const books = useRows<Book>("books", (b) => b.order("created_at"));
  return {
    subjects: subjects.data ?? [], topics: topics.data ?? [], workouts: workouts.data ?? [], books: books.data ?? [],
  };
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + (Number(b) || 0), 0);
