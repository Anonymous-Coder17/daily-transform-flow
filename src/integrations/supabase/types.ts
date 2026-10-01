export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      abstinence_logs: {
        Row: {
          id: string
          log_date: string
          note: string | null
          rule_id: string
          status: string
          trigger_note: string | null
          user_id: string
        }
        Insert: {
          id?: string
          log_date: string
          note?: string | null
          rule_id: string
          status: string
          trigger_note?: string | null
          user_id?: string
        }
        Update: {
          id?: string
          log_date?: string
          note?: string | null
          rule_id?: string
          status?: string
          trigger_note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abstinence_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "abstinence_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      abstinence_rules: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          name: string
          sort: number
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          name: string
          sort?: number
          user_id?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          name?: string
          sort?: number
          user_id?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          archived: boolean
          author: string | null
          created_at: string
          id: string
          title: string
          total_pages: number | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          author?: string | null
          created_at?: string
          id?: string
          title: string
          total_pages?: number | null
          user_id?: string
        }
        Update: {
          archived?: boolean
          author?: string | null
          created_at?: string
          id?: string
          title?: string
          total_pages?: number | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          external_id: string | null
          id: string
          kind: string
          recurrence: string
          recurrence_until: string | null
          start_time: string | null
          subject_id: string | null
          title: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          external_id?: string | null
          id?: string
          kind?: string
          recurrence?: string
          recurrence_until?: string | null
          start_time?: string | null
          subject_id?: string | null
          title: string
          user_id?: string
          workout_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          external_id?: string | null
          id?: string
          kind?: string
          recurrence?: string
          recurrence_until?: string | null
          start_time?: string | null
          subject_id?: string | null
          title?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          title: string
          user_id: string
          why: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          title?: string
          user_id?: string
          why?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          title?: string
          user_id?: string
          why?: string | null
        }
        Relationships: []
      }
      event_actuals: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          event_id: string
          id: string
          note: string | null
          occurrence_date: string
          status: string
          user_id: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          event_id: string
          id?: string
          note?: string | null
          occurrence_date: string
          status?: string
          user_id?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          event_id?: string
          id?: string
          note?: string | null
          occurrence_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_actuals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          completed: boolean
          habit_id: string
          id: string
          log_date: string
          note: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          completed?: boolean
          habit_id: string
          id?: string
          log_date: string
          note?: string | null
          user_id?: string
          value?: number | null
        }
        Update: {
          completed?: boolean
          habit_id?: string
          id?: string
          log_date?: string
          note?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived: boolean
          created_at: string
          custom_rule: string | null
          description: string | null
          frequency_type: string
          id: string
          is_optional: boolean
          name: string
          sort: number
          target_value: number | null
          tracking_type: string
          unit: string | null
          user_id: string
          weekdays: number[]
          weekly_target: number | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          custom_rule?: string | null
          description?: string | null
          frequency_type?: string
          id?: string
          is_optional?: boolean
          name: string
          sort?: number
          target_value?: number | null
          tracking_type?: string
          unit?: string | null
          user_id?: string
          weekdays?: number[]
          weekly_target?: number | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          custom_rule?: string | null
          description?: string | null
          frequency_type?: string
          id?: string
          is_optional?: boolean
          name?: string
          sort?: number
          target_value?: number | null
          tracking_type?: string
          unit?: string | null
          user_id?: string
          weekdays?: number[]
          weekly_target?: number | null
        }
        Relationships: []
      }
      hifz_logs: {
        Row: {
          ayahs: number
          end_ayah: number | null
          id: string
          log_date: string
          note: string | null
          start_ayah: number | null
          surah: string | null
          user_id: string
        }
        Insert: {
          ayahs?: number
          end_ayah?: number | null
          id?: string
          log_date: string
          note?: string | null
          start_ayah?: number | null
          surah?: string | null
          user_id?: string
        }
        Update: {
          ayahs?: number
          end_ayah?: number | null
          id?: string
          log_date?: string
          note?: string | null
          start_ayah?: number | null
          surah?: string | null
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          connected_at: string | null
          id: string
          last_sync_at: string | null
          provider: string
          status: string
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          id?: string
          last_sync_at?: string | null
          provider: string
          status?: string
          user_id?: string
        }
        Update: {
          connected_at?: string | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          biggest_distraction: string | null
          change_tomorrow: string | null
          content: string | null
          entry_date: string
          id: string
          updated_at: string
          user_id: string
          went_well: string | null
          went_wrong: string | null
        }
        Insert: {
          biggest_distraction?: string | null
          change_tomorrow?: string | null
          content?: string | null
          entry_date: string
          id?: string
          updated_at?: string
          user_id?: string
          went_well?: string | null
          went_wrong?: string | null
        }
        Update: {
          biggest_distraction?: string | null
          change_tomorrow?: string | null
          content?: string | null
          entry_date?: string
          id?: string
          updated_at?: string
          user_id?: string
          went_well?: string | null
          went_wrong?: string | null
        }
        Relationships: []
      }
      limit_logs: {
        Row: {
          id: string
          limit_id: string
          log_date: string
          minutes: number
          note: string | null
          user_id: string
        }
        Insert: {
          id?: string
          limit_id: string
          log_date: string
          minutes?: number
          note?: string | null
          user_id?: string
        }
        Update: {
          id?: string
          limit_id?: string
          log_date?: string
          minutes?: number
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "limit_logs_limit_id_fkey"
            columns: ["limit_id"]
            isOneToOne: false
            referencedRelation: "limits"
            referencedColumns: ["id"]
          },
        ]
      }
      limits: {
        Row: {
          archived: boolean
          created_at: string
          daily_limit_minutes: number
          id: string
          name: string
          sort: number
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          daily_limit_minutes?: number
          id?: string
          name: string
          sort?: number
          user_id?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          daily_limit_minutes?: number
          id?: string
          name?: string
          sort?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      reading_logs: {
        Row: {
          book_id: string
          created_at: string
          id: string
          log_date: string
          note: string | null
          pages: number
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          log_date?: string
          note?: string | null
          pages: number
          user_id?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          log_date?: string
          note?: string | null
          pages?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_logs_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      review_metrics: {
        Row: {
          baseline_value: string | null
          challenge_id: string
          final_value: string | null
          id: string
          metric: string
          sort: number
          user_id: string
        }
        Insert: {
          baseline_value?: string | null
          challenge_id: string
          final_value?: string | null
          id?: string
          metric: string
          sort?: number
          user_id?: string
        }
        Update: {
          baseline_value?: string | null
          challenge_id?: string
          final_value?: string | null
          id?: string
          metric?: string
          sort?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_metrics_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          ended_at: string | null
          id: string
          notes: string | null
          session_date: string
          source: string
          started_at: string | null
          subject_id: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          ended_at?: string | null
          id?: string
          notes?: string | null
          session_date?: string
          source?: string
          started_at?: string | null
          subject_id: string
          topic_id?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          notes?: string | null
          session_date?: string
          source?: string
          started_at?: string | null
          subject_id?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          archived: boolean
          color: string | null
          id: string
          name: string
          sort: number
          user_id: string
        }
        Insert: {
          archived?: boolean
          color?: string | null
          id?: string
          name: string
          sort?: number
          user_id?: string
        }
        Update: {
          archived?: boolean
          color?: string | null
          id?: string
          name?: string
          sort?: number
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          done: boolean
          done_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: number
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          archived: boolean
          id: string
          name: string
          sort: number
          subject_id: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          id?: string
          name: string
          sort?: number
          subject_id: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          id?: string
          name?: string
          sort?: number
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          archived: boolean
          id: string
          measurement: string
          name: string
          sort: number
          target_sets: number | null
          target_value: number | null
          unit: string | null
          user_id: string
          workout_id: string
        }
        Insert: {
          archived?: boolean
          id?: string
          measurement?: string
          name: string
          sort?: number
          target_sets?: number | null
          target_value?: number | null
          unit?: string | null
          user_id?: string
          workout_id: string
        }
        Update: {
          archived?: boolean
          id?: string
          measurement?: string
          name?: string
          sort?: number
          target_sets?: number | null
          target_value?: number | null
          unit?: string | null
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_schedule: {
        Row: {
          id: string
          user_id: string
          weekday: number
          workout_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          weekday: number
          workout_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          weekday?: number
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_schedule_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          completed: boolean
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          session_date: string
          user_id: string
          workout_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          session_date?: string
          user_id?: string
          workout_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          session_date?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          exercise_id: string
          id: string
          note: string | null
          session_id: string
          set_number: number
          user_id: string
          value: number
          weight: number | null
        }
        Insert: {
          exercise_id: string
          id?: string
          note?: string | null
          session_id: string
          set_number?: number
          user_id?: string
          value: number
          weight?: number | null
        }
        Update: {
          exercise_id?: string
          id?: string
          note?: string | null
          session_id?: string
          set_number?: number
          user_id?: string
          value?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          archived: boolean
          created_at: string
          duration_minutes: number | null
          id: string
          name: string
          sort: number
          tracking: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          duration_minutes?: number | null
          id?: string
          name: string
          sort?: number
          tracking?: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          duration_minutes?: number | null
          id?: string
          name?: string
          sort?: number
          tracking?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_defaults: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
