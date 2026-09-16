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
    PostgrestVersion: "14.5"
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
      app_versions: {
        Row: {
          created_at: string
          id: string
          min_version: string
          notes: string | null
          platform: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_version?: string
          notes?: string | null
          platform: string
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          id?: string
          min_version?: string
          notes?: string | null
          platform?: string
          updated_at?: string
          version?: string
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
      credit_events: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          kind: string
          reason: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          reason?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          email: string
          error: string | null
          id: string
          kind: string
          status: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          email: string
          error?: string | null
          id?: string
          kind: string
          status?: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          kind?: string
          status?: string
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
          audio_duration: number | null
          audio_path: string | null
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
          audio_duration?: number | null
          audio_path?: string | null
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
          audio_duration?: number | null
          audio_path?: string | null
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
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
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
      plans: {
        Row: {
          access: Json
          active: boolean
          audience: string
          boosts: number
          code: string
          created_at: string
          duration_days: number
          emoji: string | null
          features: string[]
          highlight: boolean
          id: string
          likes_per_day: number
          messages_per_day: number
          name: string
          price_ttc: number
          rewinds: number
          sort_order: number
          super_likes: number
          tagline: string | null
          updated_at: string
          vat_rate: number
        }
        Insert: {
          access?: Json
          active?: boolean
          audience?: string
          boosts?: number
          code: string
          created_at?: string
          duration_days?: number
          emoji?: string | null
          features?: string[]
          highlight?: boolean
          id?: string
          likes_per_day?: number
          messages_per_day?: number
          name: string
          price_ttc?: number
          rewinds?: number
          sort_order?: number
          super_likes?: number
          tagline?: string | null
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          access?: Json
          active?: boolean
          audience?: string
          boosts?: number
          code?: string
          created_at?: string
          duration_days?: number
          emoji?: string | null
          features?: string[]
          highlight?: boolean
          id?: string
          likes_per_day?: number
          messages_per_day?: number
          name?: string
          price_ttc?: number
          rewinds?: number
          sort_order?: number
          super_likes?: number
          tagline?: string | null
          updated_at?: string
          vat_rate?: number
        }
        Relationships: []
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
          body_type: string | null
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
          last_seen: string
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
          body_type?: string | null
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
          last_seen?: string
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
          body_type?: string | null
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
          last_seen?: string
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
          last_notified_at: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          last_notified_at?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          last_notified_at?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      section_archives: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          label: string
          note: string | null
          payload: Json
          row_count: number
          section: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          note?: string | null
          payload?: Json
          row_count?: number
          section: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          note?: string | null
          payload?: Json
          row_count?: number
          section?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      social_links: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          network: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          network: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          network?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_ttc: number
          auto_renew: boolean
          cancelled_at: string | null
          created_at: string
          ends_at: string | null
          id: string
          payment_method: string
          plan_code: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
          vat_rate: number
        }
        Insert: {
          amount_ttc?: number
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          payment_method?: string
          plan_code: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          vat_rate?: number
        }
        Update: {
          amount_ttc?: number
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          payment_method?: string
          plan_code?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          id: string
          last_reply_at: string | null
          message: string
          priority: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          id?: string
          last_reply_at?: string | null
          message: string
          priority?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          last_reply_at?: string | null
          message?: string
          priority?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_replies: {
        Row: {
          author: string
          author_id: string | null
          content: string
          created_at: string
          id: string
          internal: boolean
          ticket_id: string
        }
        Insert: {
          author?: string
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          internal?: boolean
          ticket_id: string
        }
        Update: {
          author?: string
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          boosts: number
          likes_balance: number
          likes_used_today: number
          reset_at: string
          super_likes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          boosts?: number
          likes_balance?: number
          likes_used_today?: number
          reset_at?: string
          super_likes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          boosts?: number
          likes_balance?: number
          likes_used_today?: number
          reset_at?: string
          super_likes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      visits: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          ip_hash: string | null
          path: string
          referrer: string | null
          region: string | null
          source: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          path: string
          referrer?: string | null
          region?: string | null
          source?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          path?: string
          referrer?: string | null
          region?: string | null
          source?: string
          user_agent?: string | null
          user_id?: string | null
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
      delete_own_account:
        | { Args: never; Returns: undefined }
        | { Args: { user_id: string }; Returns: undefined }
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
