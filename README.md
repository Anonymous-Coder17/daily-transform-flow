# Transformation Tracker

Build a polished full-stack responsive PWA called "30-Day Transformation" for personal use on MacBook and Android.

Product principle: Plan → Execute → Record → Review → Adjust. Calendar is the main/home page. The user plans tomorrow in advance, then records what actually happened.

Use Lovable's default full-stack TypeScript/Tailwind/shadcn stack. Responsive desktop/mobile, installable PWA where practical, private authenticated user data with database/RLS. Calm premium productivity UI, dark/light/system theme, mobile bottom nav and desktop sidebar.

MAIN NAV: Calendar (home), Habits & Routines, Training, Study, Progress, Journal.

30-DAY CHALLENGE: setup start/end dates (default 30 days), title, personal Why, editable later, daily navigation and 30-day overview. Never reset the challenge because of a failure.

DO NOT TRACK PRAYER. Prayer is intentionally outside this app.

CALENDAR: Day/Week/Month views; timeline/agenda; add/edit/delete events and tasks; recurring items; strong Plan Tomorrow workflow; distinguish Planned vs Actual; allow planned study/workout blocks. Prepare clean Google Calendar integration architecture; if OAuth cannot be completed now, provide an Integration/Settings area with truthful disconnected state and keep the internal calendar fully functional.

HABITS: customizable add/edit/archive. Defaults: Meditation daily completion-based; Tahajjud optional weekly target 2. Reading is tracked separately. Frequency options daily, selected weekdays, weekly target, custom. Tracking types completion/count/duration. Weekly/monthly consistency.

DISTRACTIONS HAVE TWO TYPES:
ABSTAIN (complete avoidance): Porn, Instagram, Telegram, Games. Daily clean/incident status, optional trigger/notes. Incident NEVER resets the challenge.
LIMIT (controlled usage): YouTube default configurable 45 min/day, WhatsApp default configurable 30 min/day. Manual actual-minute logging in v1. Allow add/edit/archive both types. Clearly separate them in UI/analytics.

TRAINING: configurable weekly schedule, default suggested HSPU, 20-minute abs, 20-minute leg, rest, repeat, targeting 5 workout days/week but editable.
HSPU is progressive: editable workout template and exercises; exercise measurement reps/time/weight/distance/custom; record sets; show previous session; simple non-forced progression suggestions; history/PRs/volume where meaningful. Default editable exercises: Wall HSPU, Negative HSPU, Pike HSPU, Handstand Hold.
ABS AND LEGS are completion-only ("20-minute abs workout", "20-minute leg workout"), no fake progression metrics. Custom workouts can choose simple or progressive tracking.

STUDY: timer-based. Select Subject + Topic, start/stop timer, save session, plus manual entry. Default Mathematics -> Linear Algebra, Calculus, Statistics. Custom subjects/topics. Analytics by subject/topic/day/week/month. Planned vs actual when calendar blocks exist.

HIFZ: daily ayahs memorized can be any number including 0. Fast input. Weekly/monthly totals/trend. Optional future metadata for Surah/start/end ayah but keep v1 simple. Never treat 0 as failure.

READING: pages/day, customizable books, per-book history, weekly/monthly totals and average.

JOURNAL: free-form date-based daily journal plus optional review prompts: what went well, what went wrong, biggest distraction, what to change tomorrow. Searchable; not required daily.

TODAY/DASHBOARD: calendar home should also show today's plan, habits, workout, study time by subject, Hifz ayahs, reading pages, abstinence status, limits, and quick actions for timer/Hifz/reading/distraction/journal.

PROGRESS: no single overall score. Show independent analytics for abstinence, limits, habits, workouts, HSPU progression, study by subject/topic, Hifz, reading, planned-vs-actual schedule adherence, journaling, weekly and 30-day summaries, 30-day heatmap. Optional Day 1 baseline and Day 30 comparison fields for focus/energy/study time/sleep/gaming etc.

SETTINGS: edit challenge, add/edit/archive habits, abstinence rules, limits, subjects/topics, workouts/exercises, books, targets/frequencies, Google Calendar integration status, theme, export if practical.

NORMALIZED DATABASE: users/profile, challenge, habits, habit_logs, abstinence_rules, abstinence_logs/incidents, limits, limit_logs, workouts, workout_exercises, workout_sessions, workout_sets, subjects, topics, study_sessions, hifz_logs, books, reading_logs, tasks, calendar_events, journal/daily_reviews, baseline/review data as appropriate. Do not put all data into generic JSON.

SEED DEFAULTS for a new user so the app is immediately usable, while allowing all defaults to be edited.

Build the actual app, database, auth, responsive UI and working core flows—not a landing page/mockup. Make primary forms/buttons functional end-to-end.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://daily-transform-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/41e70e1a-d2a1-45e9-900f-0dc4d730a022).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
