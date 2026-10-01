import type { CalEvent } from "./data";
import { weekdayOf } from "./dates";

export function occursOn(e: CalEvent, date: string) {
  if (date < e.event_date) return false;
  if (e.recurrence_until && date > e.recurrence_until) return false;
  switch (e.recurrence) {
    case "none": return date === e.event_date;
    case "daily": return true;
    case "weekdays": { const w = weekdayOf(date); return w >= 1 && w <= 5; }
    case "weekly": return weekdayOf(date) === weekdayOf(e.event_date);
    default: return false;
  }
}

export const eventsOn = (events: CalEvent[], date: string) =>
  events.filter((e) => occursOn(e, date)).sort((a, b) => (a.start_time ?? "99").localeCompare(b.start_time ?? "99"));

export const KIND_LABEL: Record<string, string> = { event: "Event", study: "Study block", workout: "Workout block", task: "Task", other: "Other" };
export const KIND_DOT: Record<string, string> = {
  event: "bg-chart-3", study: "bg-chart-1", workout: "bg-chart-2", task: "bg-chart-5", other: "bg-muted-foreground",
};
