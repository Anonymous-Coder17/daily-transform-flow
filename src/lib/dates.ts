import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek, getDay } from "date-fns";

export const ymd = (d: Date) => format(d, "yyyy-MM-dd");
export const todayStr = () => ymd(new Date());
export const tomorrowStr = () => ymd(addDays(new Date(), 1));
export const parse = (s: string) => parseISO(s);
export const shift = (s: string, n: number) => ymd(addDays(parseISO(s), n));
export const pretty = (s: string, f = "EEE, MMM d") => format(parseISO(s), f);
export const weekdayOf = (s: string) => getDay(parseISO(s));
export const weekStart = (s: string) => ymd(startOfWeek(parseISO(s), { weekStartsOn: 1 }));
export const range = (start: string, days: number) => Array.from({ length: days }, (_, i) => shift(start, i));
export const diffDays = (a: string, b: string) => differenceInCalendarDays(parseISO(a), parseISO(b));
export const lastNDays = (n: number, end = todayStr()) => range(shift(end, -(n - 1)), n);
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function fmtMinutes(m: number) {
  if (!m) return "0m";
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return h ? `${h}h${r ? ` ${r}m` : ""}` : `${r}m`;
}

export function fmtTime(t?: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "pm" : "am";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}${ap}`;
}

export function timeToMin(t?: string | null) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
