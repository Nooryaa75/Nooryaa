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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          target_user: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user?: string | null
        }
        Relationships: []
      }
      ads: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string
          link_url: string | null
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url: string
          link_url?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          link_url?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked: string
          blocker: string
          created_at: string
          id: string
        }
        Insert: {
          blocked: string
          blocker: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked?: string
          blocker?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_fkey"
            columns: ["blocked"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_fkey"
            columns: ["blocker"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          read: boolean
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          read?: boolean
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      conversation_hides: {
        Row: {
          created_at: string
          id: string
          peer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          peer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          peer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          from_user: string
          id: string
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          hidden_for: string[]
          id: string
          image_path: string | null
          read_at: string | null
          receiver: string
          reply_to: string | null
          sender: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          hidden_for?: string[]
          id?: string
          image_path?: string | null
          read_at?: string | null
          receiver: string
          reply_to?: string | null
          sender: string
        }
        Update: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          hidden_for?: string[]
          id?: string
          image_path?: string | null
          read_at?: string | null
          receiver?: string
          reply_to?: string | null
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_fkey"
            columns: ["receiver"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_fkey"
            columns: ["sender"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_events: {
        Row: {
          categories: string[]
          content: string
          created_at: string
          id: string
          reason: string | null
          source: string
          target_user: string | null
          user_id: string
          verdict: string
        }
        Insert: {
          categories?: string[]
          content: string
          created_at?: string
          id?: string
          reason?: string | null
          source?: string
          target_user?: string | null
          user_id: string
          verdict: string
        }
        Update: {
          categories?: string[]
          content?: string
          created_at?: string
          id?: string
          reason?: string | null
          source?: string
          target_user?: string | null
          user_id?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_events_target_user_fkey"
            columns: ["target_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          blurred: boolean
          created_at: string
          id: string
          position: number
          storage_path: string
          url: string
          user_id: string
        }
        Insert: {
          blurred?: boolean
          created_at?: string
          id?: string
          position: number
          storage_path: string
          url: string
          user_id: string
        }
        Update: {
          blurred?: boolean
          created_at?: string
          id?: string
          position?: number
          storage_path?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_passes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_passes_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_passes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activities: string | null
          bio: string | null
          birthdate: string | null
          children_count: number | null
          city: string | null
          country: string | null
          country_origin: string | null
          created_at: string
          education_level: string | null
          email: string
          first_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          grew_up: string | null
          hadj: boolean | null
          has_children: boolean | null
          height_cm: number | null
          id: string
          identity_key: string | null
          last_active: string
          last_name: string | null
          latitude: number | null
          longitude: number | null
          looking_for: Database["public"]["Enums"]["gender"] | null
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          objective: string | null
          omra: boolean | null
          onboarded: boolean
          personality: string | null
          phone: string | null
          photo_verification_status: string
          photo_verified: boolean
          photo_verified_at: string | null
          porte_voile: boolean | null
          preferences: Json
          primary_photo_blurred: boolean
          primary_photo_url: string | null
          profession: string | null
          pseudo: string
          ramadan: boolean | null
          religion: string | null
          religious_practice:
            | Database["public"]["Enums"]["religious_practice"]
            | null
          salat_quotidienne: boolean | null
          smoker: boolean | null
          status: string
          updated_at: string
          wants_children: boolean | null
        }
        Insert: {
          activities?: string | null
          bio?: string | null
          birthdate?: string | null
          children_count?: number | null
          city?: string | null
          country?: string | null
          country_origin?: string | null
          created_at?: string
          education_level?: string | null
          email: string
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          grew_up?: string | null
          hadj?: boolean | null
          has_children?: boolean | null
          height_cm?: number | null
          id: string
          identity_key?: string | null
          last_active?: string
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          looking_for?: Database["public"]["Enums"]["gender"] | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          objective?: string | null
          omra?: boolean | null
          onboarded?: boolean
          personality?: string | null
          phone?: string | null
          photo_verification_status?: string
          photo_verified?: boolean
          photo_verified_at?: string | null
          porte_voile?: boolean | null
          preferences?: Json
          primary_photo_blurred?: boolean
          primary_photo_url?: string | null
          profession?: string | null
          pseudo: string
          ramadan?: boolean | null
          religion?: string | null
          religious_practice?:
            | Database["public"]["Enums"]["religious_practice"]
            | null
          salat_quotidienne?: boolean | null
          smoker?: boolean | null
          status?: string
          updated_at?: string
          wants_children?: boolean | null
        }
        Update: {
          activities?: string | null
          bio?: string | null
          birthdate?: string | null
          children_count?: number | null
          city?: string | null
          country?: string | null
          country_origin?: string | null
          created_at?: string
          education_level?: string | null
          email?: string
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          grew_up?: string | null
          hadj?: boolean | null
          has_children?: boolean | null
          height_cm?: number | null
          id?: string
          identity_key?: string | null
          last_active?: string
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          looking_for?: Database["public"]["Enums"]["gender"] | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          objective?: string | null
          omra?: boolean | null
          onboarded?: boolean
          personality?: string | null
          phone?: string | null
          photo_verification_status?: string
          photo_verified?: boolean
          photo_verified_at?: string | null
          porte_voile?: boolean | null
          preferences?: Json
          primary_photo_blurred?: boolean
          primary_photo_url?: string | null
          profession?: string | null
          pseudo?: string
          ramadan?: boolean | null
          religion?: string | null
          religious_practice?:
            | Database["public"]["Enums"]["religious_practice"]
            | null
          salat_quotidienne?: boolean | null
          smoker?: boolean | null
          status?: string
          updated_at?: string
          wants_children?: boolean | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported: string
          reporter: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported: string
          reporter: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported?: string
          reporter?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_fkey"
            columns: ["reported"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_fkey"
            columns: ["reporter"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_message: {
        Args: { _receiver: string; _sender: string }
        Returns: boolean
      }
      delete_own_account: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked_between: { Args: { a: string; b: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      gender: "homme" | "femme"
      marital_status: "celibataire" | "divorce" | "veuf"
      religious_practice:
        | "pratiquant"
        | "tres_pratiquant"
        | "en_apprentissage"
        | "non_pratiquant"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      gender: ["homme", "femme"],
      marital_status: ["celibataire", "divorce", "veuf"],
      religious_practice: [
        "pratiquant",
        "tres_pratiquant",
        "en_apprentissage",
        "non_pratiquant",
      ],
    },
  },
} as const
