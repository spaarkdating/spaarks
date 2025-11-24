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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["admin_action_type"]
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_resource_id: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["admin_action_type"]
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_resource_id?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["admin_action_type"]
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_resource_id?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_at: string
          blocked_user_id: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string
          blocked_user_id: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string
          blocked_user_id?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boost_purchases: {
        Row: {
          amount_paid: number
          created_at: string | null
          duration_minutes: number
          expires_at: string
          id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          duration_minutes: number
          expires_at: string
          id?: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          duration_minutes?: number
          expires_at?: string
          id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boost_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          is_match: boolean | null
          liked_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_match?: boolean | null
          liked_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_match?: boolean | null
          liked_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_liked_user_id_fkey"
            columns: ["liked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          payment_method: string | null
          status: string
          subscription_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          description: string | null
          id: string
          photo_id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          photo_id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          photo_id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_reports_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          photo_url?: string
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
      profile_views: {
        Row: {
          id: string
          viewed_at: string
          viewed_profile_id: string
          viewer_id: string
        }
        Insert: {
          id?: string
          viewed_at?: string
          viewed_profile_id: string
          viewer_id: string
        }
        Update: {
          id?: string
          viewed_at?: string
          viewed_profile_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_viewed_profile_id_fkey"
            columns: ["viewed_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          dating_mode: string | null
          display_name: string | null
          drinking: string | null
          education: string | null
          email: string | null
          gender: string | null
          height: string | null
          id: string
          last_online: string | null
          last_swipe_match_id: string | null
          last_swipe_timestamp: string | null
          location: string | null
          looking_for: string | null
          max_age: number | null
          min_age: number | null
          occupation: string | null
          relationship_goal: string | null
          religion: string | null
          smoking: string | null
          updated_at: string | null
        }
        Insert: {
          account_status?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          dating_mode?: string | null
          display_name?: string | null
          drinking?: string | null
          education?: string | null
          email?: string | null
          gender?: string | null
          height?: string | null
          id: string
          last_online?: string | null
          last_swipe_match_id?: string | null
          last_swipe_timestamp?: string | null
          location?: string | null
          looking_for?: string | null
          max_age?: number | null
          min_age?: number | null
          occupation?: string | null
          relationship_goal?: string | null
          religion?: string | null
          smoking?: string | null
          updated_at?: string | null
        }
        Update: {
          account_status?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          dating_mode?: string | null
          display_name?: string | null
          drinking?: string | null
          education?: string | null
          email?: string | null
          gender?: string | null
          height?: string | null
          id?: string
          last_online?: string | null
          last_swipe_match_id?: string | null
          last_swipe_timestamp?: string | null
          location?: string | null
          looking_for?: string | null
          max_age?: number | null
          min_age?: number | null
          occupation?: string | null
          relationship_goal?: string | null
          religion?: string | null
          smoking?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_last_swipe_match_id_fkey"
            columns: ["last_swipe_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          plan_type: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          plan_type: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
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
          admin_reply: string | null
          created_at: string | null
          id: string
          message: string
          priority: string | null
          status: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          status?: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string | null
          id: string
          interest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_users_matched: {
        Args: { _user1_id: string; _user2_id: string }
        Returns: boolean
      }
      get_admin_role: { Args: never; Returns: string }
      has_active_boost: { Args: { user_profile_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_full_admin: { Args: never; Returns: boolean }
      is_moderator: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_support: { Args: never; Returns: boolean }
      update_last_online: { Args: never; Returns: undefined }
    }
    Enums: {
      admin_action_type:
        | "user_ban"
        | "user_unban"
        | "user_delete"
        | "ticket_update"
        | "ticket_resolve"
        | "ticket_close"
        | "report_approve"
        | "report_reject"
        | "role_change"
        | "admin_create"
        | "admin_delete"
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
      admin_action_type: [
        "user_ban",
        "user_unban",
        "user_delete",
        "ticket_update",
        "ticket_resolve",
        "ticket_close",
        "report_approve",
        "report_reject",
        "role_change",
        "admin_create",
        "admin_delete",
      ],
    },
  },
} as const
