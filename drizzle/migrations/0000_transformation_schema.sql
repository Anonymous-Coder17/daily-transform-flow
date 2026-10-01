
CREATE TABLE public.profiles (id uuid PRIMARY KEY DEFAULT auth.uid(), display_name text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.challenges (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), title text NOT NULL DEFAULT '30-Day Transformation', why text, start_date date NOT NULL DEFAULT current_date, end_date date NOT NULL DEFAULT current_date + 29, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.review_metrics (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE, metric text NOT NULL, baseline_value text, final_value text, sort int NOT NULL DEFAULT 0);
CREATE TABLE public.habits (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), name text NOT NULL, description text, frequency_type text NOT NULL DEFAULT 'daily' CHECK (frequency_type IN ('daily','weekdays','weekly_target','custom')), weekdays int[] NOT NULL DEFAULT '{}', weekly_target int, custom_rule text, tracking_type text NOT NULL DEFAULT 'completion' CHECK (tracking_type IN ('completion','count','duration')), target_value numeric, unit text, is_optional boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, sort int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.habit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE, log_date date NOT NULL, completed boolean NOT NULL DEFAULT false, value numeric, note text, UNIQUE (habit_id, log_date));
CREATE TABLE public.abstinence_rules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), name text NOT NULL, archived boolean NOT NULL DEFAULT false, sort int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.abstinence_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), rule_id uuid NOT NULL REFERENCES public.abstinence_rules(id) ON DELETE CASCADE, log_date date NOT NULL, status text NOT NULL CHECK (status IN ('clean','incident')), trigger_note text, note text, UNIQUE (rule_id, log_date));
CREATE TABLE public.limits (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), name text NOT NULL, daily_limit_minutes int NOT NULL DEFAULT 30, archived boolean NOT NULL DEFAULT false, sort int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.limit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), limit_id uuid NOT NULL REFERENCES public.limits(id) ON DELETE CASCADE, log_date date NOT NULL, minutes int NOT NULL DEFAULT 0, note text, UNIQUE (limit_id, log_date));
CREATE TABLE public.workouts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), name text NOT NULL, tracking text NOT NULL DEFAULT 'simple' CHECK (tracking IN ('simple','progressive')), duration_minutes int, archived boolean NOT NULL DEFAULT false, sort int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.workout_exercises (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE, name text NOT NULL, measurement text NOT NULL DEFAULT 'reps' CHECK (measurement IN ('reps','time','weight','distance','custom')), unit text, target_sets int, target_value numeric, archived boolean NOT NULL DEFAULT false, sort int NOT NULL DEFAULT 0);
CREATE TABLE public.workout_schedule (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), weekday int NOT NULL CHECK (weekday BETWEEN 0 AND 6), workout_id uuid REFERENCES public.workouts(id) ON DELETE SET NULL, UNIQUE (user_id, weekday));
CREATE TABLE public.workout_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE, session_date date NOT NULL DEFAULT current_date, completed boolean NOT NULL DEFAULT true, duration_minutes int, notes text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.workout_sets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), session_id uuid NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE, exercise_id uuid NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE, set_number int NOT NULL DEFAULT 1, value numeric NOT NULL, weight numeric, note text);
CREATE TABLE public.subjects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), name text NOT NULL, color text, archived boolean NOT NULL DEFAULT false, sort int NOT NULL DEFAULT 0);
CREATE TABLE public.topics (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE, name text NOT NULL, archived boolean NOT NULL DEFAULT false, sort int NOT NULL DEFAULT 0);
CREATE TABLE public.study_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE, topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL, session_date date NOT NULL DEFAULT current_date, started_at timestamptz, ended_at timestamptz, duration_minutes int NOT NULL, source text NOT NULL DEFAULT 'manual' CHECK (source IN ('timer','manual')), notes text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.hifz_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), log_date date NOT NULL, ayahs int NOT NULL DEFAULT 0 CHECK (ayahs >= 0), surah text, start_ayah int, end_ayah int, note text, UNIQUE (user_id, log_date));
CREATE TABLE public.books (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), title text NOT NULL, author text, total_pages int, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.reading_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE, log_date date NOT NULL DEFAULT current_date, pages int NOT NULL CHECK (pages >= 0), note text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.calendar_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), title text NOT NULL, description text, kind text NOT NULL DEFAULT 'event' CHECK (kind IN ('event','study','workout','task','other')), event_date date NOT NULL, start_time time, end_time time, recurrence text NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','daily','weekdays','weekly')), recurrence_until date, subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL, workout_id uuid REFERENCES public.workouts(id) ON DELETE SET NULL, external_id text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.event_actuals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE, occurrence_date date NOT NULL, status text NOT NULL DEFAULT 'done' CHECK (status IN ('done','partial','skipped','moved')), actual_start time, actual_end time, note text, UNIQUE (event_id, occurrence_date));
CREATE TABLE public.tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), title text NOT NULL, notes text, due_date date, done boolean NOT NULL DEFAULT false, done_at timestamptz, priority int NOT NULL DEFAULT 2, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.journal_entries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), entry_date date NOT NULL, content text, went_well text, went_wrong text, biggest_distraction text, change_tomorrow text, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, entry_date));
CREATE TABLE public.integrations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), provider text NOT NULL, status text NOT NULL DEFAULT 'disconnected', connected_at timestamptz, last_sync_at timestamptz, UNIQUE (user_id, provider));

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['challenges','review_metrics','habits','habit_logs','abstinence_rules','abstinence_logs','limits','limit_logs','workouts','workout_exercises','workout_schedule','workout_sessions','workout_sets','subjects','topics','study_sessions','hifz_logs','books','reading_logs','calendar_events','event_actuals','tasks','journal_entries','integrations'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "own rows" ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t);
    EXECUTE format('CREATE INDEX ON public.%I (user_id)', t);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.seed_defaults()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); ch uuid; hspu uuid; abs_w uuid; leg_w uuid; math uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM challenges WHERE user_id = uid) THEN RETURN false; END IF;
  INSERT INTO profiles (id) VALUES (uid) ON CONFLICT DO NOTHING;
  INSERT INTO challenges (user_id, title, start_date, end_date) VALUES (uid, '30-Day Transformation', current_date, current_date + 29) RETURNING id INTO ch;
  INSERT INTO review_metrics (user_id, challenge_id, metric, sort) VALUES
    (uid, ch, 'Focus (1-10)', 1), (uid, ch, 'Energy (1-10)', 2), (uid, ch, 'Daily study time', 3), (uid, ch, 'Sleep hours', 4), (uid, ch, 'Gaming time', 5), (uid, ch, 'Phone screen time', 6);
  INSERT INTO habits (user_id, name, frequency_type, tracking_type, sort) VALUES (uid, 'Meditation', 'daily', 'completion', 1);
  INSERT INTO habits (user_id, name, frequency_type, weekly_target, tracking_type, is_optional, sort) VALUES (uid, 'Tahajjud', 'weekly_target', 2, 'completion', true, 2);
  INSERT INTO abstinence_rules (user_id, name, sort) VALUES (uid, 'Porn', 1), (uid, 'Instagram', 2), (uid, 'Telegram', 3), (uid, 'Games', 4);
  INSERT INTO limits (user_id, name, daily_limit_minutes, sort) VALUES (uid, 'YouTube', 45, 1), (uid, 'WhatsApp', 30, 2);
  INSERT INTO workouts (user_id, name, tracking, sort) VALUES (uid, 'HSPU', 'progressive', 1) RETURNING id INTO hspu;
  INSERT INTO workouts (user_id, name, tracking, duration_minutes, sort) VALUES (uid, '20-minute abs workout', 'simple', 20, 2) RETURNING id INTO abs_w;
  INSERT INTO workouts (user_id, name, tracking, duration_minutes, sort) VALUES (uid, '20-minute leg workout', 'simple', 20, 3) RETURNING id INTO leg_w;
  INSERT INTO workout_exercises (user_id, workout_id, name, measurement, unit, target_sets, sort) VALUES
    (uid, hspu, 'Wall HSPU', 'reps', 'reps', 3, 1), (uid, hspu, 'Negative HSPU', 'reps', 'reps', 3, 2),
    (uid, hspu, 'Pike HSPU', 'reps', 'reps', 3, 3), (uid, hspu, 'Handstand Hold', 'time', 'sec', 3, 4);
  -- Mon HSPU, Tue Abs, Wed Legs, Thu Rest, Fri HSPU, Sat Abs, Sun Rest (5 workout days)
  INSERT INTO workout_schedule (user_id, weekday, workout_id) VALUES
    (uid, 1, hspu), (uid, 2, abs_w), (uid, 3, leg_w), (uid, 4, NULL), (uid, 5, hspu), (uid, 6, abs_w), (uid, 0, NULL);
  INSERT INTO subjects (user_id, name, color, sort) VALUES (uid, 'Mathematics', 'chart-1', 1) RETURNING id INTO math;
  INSERT INTO topics (user_id, subject_id, name, sort) VALUES (uid, math, 'Linear Algebra', 1), (uid, math, 'Calculus', 2), (uid, math, 'Statistics', 3);
  INSERT INTO books (user_id, title) VALUES (uid, 'My current book');
  INSERT INTO integrations (user_id, provider, status) VALUES (uid, 'google_calendar', 'disconnected');
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.seed_defaults() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.seed_defaults() TO authenticated;
