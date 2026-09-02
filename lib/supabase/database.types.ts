export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agent_settings: {
        Row: {
          daily_apply_limit: number
          enabled: boolean
          id: string
          min_match_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_apply_limit?: number
          enabled?: boolean
          id?: string
          min_match_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_apply_limit?: number
          enabled?: boolean
          id?: string
          min_match_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      application: {
        Row: {
          applied_at: string
          id: string
          mode: string
          notes: string | null
          resume_version_id: string
          status: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          id?: string
          mode?: string
          notes?: string | null
          resume_version_id: string
          status?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          id?: string
          mode?: string
          notes?: string | null
          resume_version_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_resume_version_id_fkey"
            columns: ["resume_version_id", "user_id"]
            isOneToOne: false
            referencedRelation: "resume_version"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      application_answer: {
        Row: {
          answer: string | null
          category: string
          created_at: string
          id: string
          is_sensitive: boolean
          profile_id: string
          question: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          category?: string
          created_at?: string
          id?: string
          is_sensitive?: boolean
          profile_id: string
          question: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          category?: string
          created_at?: string
          id?: string
          is_sensitive?: boolean
          profile_id?: string
          question?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_answer_profile_id_fkey"
            columns: ["profile_id", "user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      career_preferences: {
        Row: {
          availability: string | null
          created_at: string
          desired_locations: Json
          desired_roles: Json
          employment_types: Json
          id: string
          min_salary: number | null
          notes: string | null
          open_to_relocation: boolean | null
          profile_id: string
          salary_currency: string | null
          salary_period: string | null
          seniority: string | null
          source: string
          updated_at: string
          user_id: string
          work_arrangements: Json
        }
        Insert: {
          availability?: string | null
          created_at?: string
          desired_locations?: Json
          desired_roles?: Json
          employment_types?: Json
          id?: string
          min_salary?: number | null
          notes?: string | null
          open_to_relocation?: boolean | null
          profile_id: string
          salary_currency?: string | null
          salary_period?: string | null
          seniority?: string | null
          source?: string
          updated_at?: string
          user_id: string
          work_arrangements?: Json
        }
        Update: {
          availability?: string | null
          created_at?: string
          desired_locations?: Json
          desired_roles?: Json
          employment_types?: Json
          id?: string
          min_salary?: number | null
          notes?: string | null
          open_to_relocation?: boolean | null
          profile_id?: string
          salary_currency?: string | null
          salary_period?: string | null
          seniority?: string | null
          source?: string
          updated_at?: string
          user_id?: string
          work_arrangements?: Json
        }
        Relationships: [
          {
            foreignKeyName: "career_preferences_profile_id_fkey"
            columns: ["profile_id", "user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      certification: {
        Row: {
          created_at: string
          credential_id: string | null
          credential_url: string | null
          expires_on: string | null
          id: string
          issued_on: string | null
          issuer: string | null
          name: string
          profile_id: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expires_on?: string | null
          id?: string
          issued_on?: string | null
          issuer?: string | null
          name: string
          profile_id: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expires_on?: string | null
          id?: string
          issued_on?: string | null
          issuer?: string | null
          name?: string
          profile_id?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_profile_id_fkey"
            columns: ["profile_id", "user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      education: {
        Row: {
          created_at: string
          degree: string | null
          description: string | null
          end_date: string | null
          field_of_study: string | null
          grade: string | null
          id: string
          institution: string | null
          profile_id: string
          source: string
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution?: string | null
          profile_id: string
          source?: string
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution?: string | null
          profile_id?: string
          source?: string
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_profile_id_fkey"
            columns: ["profile_id", "user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      experience: {
        Row: {
          company: string | null
          created_at: string
          description: string | null
          employment_type: string | null
          end_date: string | null
          id: string
          location: string | null
          profile_id: string
          source: string
          start_date: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          profile_id: string
          source?: string
          start_date?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          profile_id?: string
          source?: string
          start_date?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_profile_id_fkey"
            columns: ["profile_id", "user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      experience_achievement: {
        Row: {
          content: string
          created_at: string
          experience_id: string
          id: string
          sort_order: number
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          experience_id: string
          id?: string
          sort_order?: number
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          experience_id?: string
          id?: string
          sort_order?: number
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_achievement_experience_id_fkey"
            columns: ["experience_id", "user_id"]
            isOneToOne: false
            referencedRelation: "experience"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      job: {
        Row: {
          company: string | null
          created_at: string
          description: string | null
          id: string
          posted_at: string | null
          source: string | null
          source_url: string | null
          title: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          description?: string | null
          id?: string
          posted_at?: string | null
          source?: string | null
          source_url?: string | null
          title?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          description?: string | null
          id?: string
          posted_at?: string | null
          source?: string | null
          source_url?: string | null
          title?: string | null
        }
        Relationships: []
      }
      job_analysis: {
        Row: {
          created_at: string
          id: string
          job_id: string
          match_score: number | null
          preferred_skills: Json
          required_skills: Json
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          match_score?: number | null
          preferred_skills?: Json
          required_skills?: Json
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          match_score?: number | null
          preferred_skills?: Json
          required_skills?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_analysis_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job"
            referencedColumns: ["id"]
          },
        ]
      }
      master_resume: {
        Row: {
          file_url: string | null
          id: string
          profile_id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_url?: string | null
          id?: string
          profile_id: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_url?: string | null
          id?: string
          profile_id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_resume_profile_id_fkey"
            columns: ["profile_id", "user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      profile: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          headline: string | null
          id: string
          links: Json
          location: string | null
          phone: string | null
          source: string
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          links?: Json
          location?: string | null
          phone?: string | null
          source?: string
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          links?: Json
          location?: string | null
          phone?: string | null
          source?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_skill: {
        Row: {
          created_at: string
          id: string
          proficiency: string | null
          profile_id: string
          skill_id: string
          source: string
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          proficiency?: string | null
          profile_id: string
          skill_id: string
          source?: string
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          proficiency?: string | null
          profile_id?: string
          skill_id?: string
          source?: string
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_skill_profile_id_fkey"
            columns: ["profile_id", "user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "profile_skill_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
        ]
      }
      project: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string | null
          profile_id: string
          role: string | null
          source: string
          start_date: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string | null
          profile_id: string
          role?: string | null
          source?: string
          start_date?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string | null
          profile_id?: string
          role?: string | null
          source?: string
          start_date?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_profile_id_fkey"
            columns: ["profile_id", "user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      project_skill: {
        Row: {
          created_at: string
          id: string
          project_id: string
          skill_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          skill_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_skill_project_id_fkey"
            columns: ["project_id", "user_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "project_skill_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_version: {
        Row: {
          content: Json
          created_at: string
          id: string
          job_id: string
          pdf_url: string | null
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          job_id: string
          pdf_url?: string | null
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          job_id?: string
          pdf_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_version_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job"
            referencedColumns: ["id"]
          },
        ]
      }
      skill: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

