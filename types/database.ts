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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ayah_audio: {
        Row: {
          audio_url: string
          ayah_id: string
          created_at: string
          duration: number | null
          id: string
          recitation_id: string
          source_id: string | null
        }
        Insert: {
          audio_url: string
          ayah_id: string
          created_at?: string
          duration?: number | null
          id?: string
          recitation_id: string
          source_id?: string | null
        }
        Update: {
          audio_url?: string
          ayah_id?: string
          created_at?: string
          duration?: number | null
          id?: string
          recitation_id?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ayah_audio_ayah_id_fkey"
            columns: ["ayah_id"]
            isOneToOne: false
            referencedRelation: "ayahs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ayah_audio_recitation_id_fkey"
            columns: ["recitation_id"]
            isOneToOne: false
            referencedRelation: "recitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ayah_audio_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ayahs: {
        Row: {
          ayah_number: number
          created_at: string
          global_ayah_number: number | null
          id: string
          source_id: string | null
          surah_id: string
          text_simple: string | null
          text_uthmani: string
        }
        Insert: {
          ayah_number: number
          created_at?: string
          global_ayah_number?: number | null
          id?: string
          source_id?: string | null
          surah_id: string
          text_simple?: string | null
          text_uthmani: string
        }
        Update: {
          ayah_number?: number
          created_at?: string
          global_ayah_number?: number | null
          id?: string
          source_id?: string | null
          surah_id?: string
          text_simple?: string | null
          text_uthmani?: string
        }
        Relationships: [
          {
            foreignKeyName: "ayahs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ayahs_surah_id_fkey"
            columns: ["surah_id"]
            isOneToOne: false
            referencedRelation: "surahs"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_options: {
        Row: {
          content: string
          created_at: string
          exercise_id: string
          id: string
          is_correct: boolean
          position: number
          word_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          exercise_id: string
          id?: string
          is_correct?: boolean
          position: number
          word_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          exercise_id?: string
          id?: string
          is_correct?: boolean
          position?: number
          word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_options_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_options_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "quran_words"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          difficulty: number
          id: string
          lesson_id: string
          metadata: Json
          position: number
          prompt: string
          type: string
        }
        Insert: {
          created_at?: string
          difficulty?: number
          id?: string
          lesson_id: string
          metadata?: Json
          position: number
          prompt?: string
          type: string
        }
        Update: {
          created_at?: string
          difficulty?: number
          id?: string
          lesson_id?: string
          metadata?: Json
          position?: number
          prompt?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      hikma_migrations: {
        Row: {
          applied_at: string
          name: string | null
          version: string
        }
        Insert: {
          applied_at?: string
          name?: string | null
          version: string
        }
        Update: {
          applied_at?: string
          name?: string | null
          version?: string
        }
        Relationships: []
      }
      imports: {
        Row: {
          completed_at: string | null
          created_at: string
          error_log: Json | null
          id: string
          records_failed: number
          records_imported: number
          records_updated: number
          source_id: string
          started_at: string | null
          status: string
          version: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          id?: string
          records_failed?: number
          records_imported?: number
          records_updated?: number
          source_id: string
          started_at?: string | null
          status?: string
          version?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          id?: string
          records_failed?: number
          records_imported?: number
          records_updated?: number
          source_id?: string
          started_at?: string | null
          status?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imports_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string
          description: string | null
          id: string
          slug: string
          sort_order: number
          surah_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          slug: string
          sort_order?: number
          surah_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          slug?: string
          sort_order?: number
          surah_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_surah_id_fkey"
            columns: ["surah_id"]
            isOneToOne: false
            referencedRelation: "surahs"
            referencedColumns: ["id"]
          },
        ]
      }
      lemma_translations: {
        Row: {
          created_at: string
          editorial_notes: string | null
          id: string
          is_validated: boolean
          language: string
          lemma_id: string
          source_id: string
          text: string
          updated_at: string
          validated_at: string | null
        }
        Insert: {
          created_at?: string
          editorial_notes?: string | null
          id?: string
          is_validated?: boolean
          language: string
          lemma_id: string
          source_id: string
          text: string
          updated_at?: string
          validated_at?: string | null
        }
        Update: {
          created_at?: string
          editorial_notes?: string | null
          id?: string
          is_validated?: boolean
          language?: string
          lemma_id?: string
          source_id?: string
          text?: string
          updated_at?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lemma_translations_lemma_id_fkey"
            columns: ["lemma_id"]
            isOneToOne: false
            referencedRelation: "lemmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lemma_translations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      lemmas: {
        Row: {
          arabic: string
          created_at: string
          id: string
          meaning: string | null
          root: string | null
          source_id: string | null
          status: string
          transliteration: string | null
          validated_at: string | null
        }
        Insert: {
          arabic: string
          created_at?: string
          id?: string
          meaning?: string | null
          root?: string | null
          source_id?: string | null
          status?: string
          transliteration?: string | null
          validated_at?: string | null
        }
        Update: {
          arabic?: string
          created_at?: string
          id?: string
          meaning?: string | null
          root?: string | null
          source_id?: string | null
          status?: string
          transliteration?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lemmas_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_words: {
        Row: {
          created_at: string
          id: string
          importance: number
          is_new: boolean
          lesson_id: string
          position: number
          word_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          importance?: number
          is_new?: boolean
          lesson_id: string
          position: number
          word_id: string
        }
        Update: {
          created_at?: string
          id?: string
          importance?: number
          is_new?: boolean
          lesson_id?: string
          position?: number
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_words_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "quran_words"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          description: string | null
          difficulty: number
          id: string
          objective: string | null
          slug: string
          sort_order: number
          status: string
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: number
          id?: string
          objective?: string | null
          slug: string
          sort_order?: number
          status?: string
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: number
          id?: string
          objective?: string | null
          slug?: string
          sort_order?: number
          status?: string
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      quran_words: {
        Row: {
          arabic: string
          created_at: string
          id: string
          lemma_id: string | null
          meaning: string | null
          root: string | null
          source_id: string | null
          transliteration: string | null
        }
        Insert: {
          arabic: string
          created_at?: string
          id?: string
          lemma_id?: string | null
          meaning?: string | null
          root?: string | null
          source_id?: string | null
          transliteration?: string | null
        }
        Update: {
          arabic?: string
          created_at?: string
          id?: string
          lemma_id?: string | null
          meaning?: string | null
          root?: string | null
          source_id?: string | null
          transliteration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quran_words_lemma_id_fkey"
            columns: ["lemma_id"]
            isOneToOne: false
            referencedRelation: "lemmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quran_words_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      recitations: {
        Row: {
          audio_url: string | null
          created_at: string
          duration: number | null
          id: string
          name: string
          qirat: string | null
          quran_com_id: number | null
          reciter_id: number | null
          source_id: string | null
          style: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          name: string
          qirat?: string | null
          quran_com_id?: number | null
          reciter_id?: number | null
          source_id?: string | null
          style?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          name?: string
          qirat?: string | null
          quran_com_id?: number | null
          reciter_id?: number | null
          source_id?: string | null
          style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recitations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      review_items: {
        Row: {
          created_at: string
          id: string
          interval_days: number
          last_review_at: string | null
          next_review_at: string | null
          status: string
          updated_at: string
          user_id: string
          word_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interval_days?: number
          last_review_at?: string | null
          next_review_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          word_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interval_days?: number
          last_review_at?: string | null
          next_review_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_items_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "quran_words"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          created_at: string
          id: string
          license: string | null
          metadata: Json
          name: string
          retrieved_at: string | null
          type: string
          url: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          license?: string | null
          metadata?: Json
          name: string
          retrieved_at?: string | null
          type: string
          url?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          license?: string | null
          metadata?: Json
          name?: string
          retrieved_at?: string | null
          type?: string
          url?: string | null
          version?: string | null
        }
        Relationships: []
      }
      surahs: {
        Row: {
          ayah_count: number
          created_at: string
          id: string
          name_arabic: string
          name_translation: string | null
          name_transliteration: string | null
          number: number
          revelation_place: string | null
          source_id: string | null
        }
        Insert: {
          ayah_count: number
          created_at?: string
          id?: string
          name_arabic: string
          name_translation?: string | null
          name_transliteration?: string | null
          number: number
          revelation_place?: string | null
          source_id?: string | null
        }
        Update: {
          ayah_count?: number
          created_at?: string
          id?: string
          name_arabic?: string
          name_translation?: string | null
          name_transliteration?: string | null
          number?: number
          revelation_place?: string | null
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surahs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          ayah_id: string
          created_at: string
          id: string
          language: string
          resource_id: number
          source_id: string | null
          text: string
          translator: string
        }
        Insert: {
          ayah_id: string
          created_at?: string
          id?: string
          language: string
          resource_id: number
          source_id?: string | null
          text: string
          translator: string
        }
        Update: {
          ayah_id?: string
          created_at?: string
          id?: string
          language?: string
          resource_id?: number
          source_id?: string | null
          text?: string
          translator?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_ayah_id_fkey"
            columns: ["ayah_id"]
            isOneToOne: false
            referencedRelation: "ayahs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          description: string | null
          id: string
          path_id: string
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          path_id: string
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          path_id?: string
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_lessons: {
        Row: {
          activity_date: string
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          activity_date: string
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_words: {
        Row: {
          activity_date: string
          created_at: string
          id: string
          user_id: string
          word_id: string
        }
        Insert: {
          activity_date: string
          created_at?: string
          id?: string
          user_id: string
          word_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          id?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "quran_words"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          daily_goal_type: string
          daily_goal_value: number
          onboarded: boolean
          onboarding_version: number
          display_name: string | null
          learning_goal: string | null
          arabic_reading_level: string | null
          quran_familiarity: string | null
          daily_duration: number | null
          learning_pace: string | null
          preferred_surah_number: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_goal_type?: string
          daily_goal_value?: number
          onboarded?: boolean
          onboarding_version?: number
          display_name?: string | null
          learning_goal?: string | null
          arabic_reading_level?: string | null
          quran_familiarity?: string | null
          daily_duration?: number | null
          learning_pace?: string | null
          preferred_surah_number?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_goal_type?: string
          daily_goal_value?: number
          onboarded?: boolean
          onboarding_version?: number
          display_name?: string | null
          learning_goal?: string | null
          arabic_reading_level?: string | null
          quran_familiarity?: string | null
          daily_duration?: number | null
          learning_pace?: string | null
          preferred_surah_number?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_word_progress: {
        Row: {
          correct_count: number
          created_at: string
          id: string
          incorrect_count: number
          last_seen_at: string | null
          mastery: number
          next_review_at: string | null
          status: string
          updated_at: string
          user_id: string
          word_id: string
        }
        Insert: {
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          last_seen_at?: string | null
          mastery?: number
          next_review_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          word_id: string
        }
        Update: {
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          last_seen_at?: string | null
          mastery?: number
          next_review_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_word_progress_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "quran_words"
            referencedColumns: ["id"]
          },
        ]
      }
      word_audio: {
        Row: {
          audio_url: string
          created_at: string
          duration: number | null
          id: string
          recitation_id: string | null
          source_id: string | null
          word_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          duration?: number | null
          id?: string
          recitation_id?: string | null
          source_id?: string | null
          word_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          duration?: number | null
          id?: string
          recitation_id?: string | null
          source_id?: string | null
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_audio_recitation_id_fkey"
            columns: ["recitation_id"]
            isOneToOne: false
            referencedRelation: "recitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_audio_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_audio_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "quran_words"
            referencedColumns: ["id"]
          },
        ]
      }
      word_occurrences: {
        Row: {
          ayah_id: string
          created_at: string
          id: string
          normalized_text: string | null
          position: number
          source_id: string | null
          text: string
          word_id: string
        }
        Insert: {
          ayah_id: string
          created_at?: string
          id?: string
          normalized_text?: string | null
          position: number
          source_id?: string | null
          text: string
          word_id: string
        }
        Update: {
          ayah_id?: string
          created_at?: string
          id?: string
          normalized_text?: string | null
          position?: number
          source_id?: string | null
          text?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_occurrences_ayah_id_fkey"
            columns: ["ayah_id"]
            isOneToOne: false
            referencedRelation: "ayahs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_occurrences_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_occurrences_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "quran_words"
            referencedColumns: ["id"]
          },
        ]
      }
      word_translations: {
        Row: {
          created_at: string
          editorial_notes: string | null
          id: string
          is_validated: boolean
          language: string
          source_id: string
          text: string
          updated_at: string
          validated_at: string | null
          word_id: string
        }
        Insert: {
          created_at?: string
          editorial_notes?: string | null
          id?: string
          is_validated?: boolean
          language: string
          source_id: string
          text: string
          updated_at?: string
          validated_at?: string | null
          word_id: string
        }
        Update: {
          created_at?: string
          editorial_notes?: string | null
          id?: string
          is_validated?: boolean
          language?: string
          source_id?: string
          text?: string
          updated_at?: string
          validated_at?: string | null
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_translations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_translations_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "quran_words"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
