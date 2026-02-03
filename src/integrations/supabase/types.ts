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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          applied: boolean | null
          applied_at: string | null
          business_description: string
          created_at: string
          generated_bio: string | null
          generated_colors: Json | null
          generated_ctas: Json | null
          generated_font: string | null
          generated_layout: string | null
          id: string
          user_id: string
        }
        Insert: {
          applied?: boolean | null
          applied_at?: string | null
          business_description: string
          created_at?: string
          generated_bio?: string | null
          generated_colors?: Json | null
          generated_ctas?: Json | null
          generated_font?: string | null
          generated_layout?: string | null
          id?: string
          user_id: string
        }
        Update: {
          applied?: boolean | null
          applied_at?: string | null
          business_description?: string
          created_at?: string
          generated_bio?: string | null
          generated_colors?: Json | null
          generated_ctas?: Json | null
          generated_font?: string | null
          generated_layout?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      appearance_settings: {
        Row: {
          background_color: string | null
          background_gradient: string | null
          background_type: string | null
          bio_color: string | null
          button_color: string | null
          button_style: string | null
          created_at: string
          font_family: string | null
          id: string
          theme: string | null
          title_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background_color?: string | null
          background_gradient?: string | null
          background_type?: string | null
          bio_color?: string | null
          button_color?: string | null
          button_style?: string | null
          created_at?: string
          font_family?: string | null
          id?: string
          theme?: string | null
          title_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background_color?: string | null
          background_gradient?: string | null
          background_type?: string | null
          bio_color?: string | null
          button_color?: string | null
          button_style?: string | null
          created_at?: string
          font_family?: string | null
          id?: string
          theme?: string | null
          title_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      earnings: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          source: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          source?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      links: {
        Row: {
          clicks: number | null
          created_at: string
          id: string
          is_active: boolean | null
          position: number | null
          title: string
          type: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          clicks?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          position?: number | null
          title: string
          type?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          clicks?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          position?: number | null
          title?: string
          type?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      stream_chat: {
        Row: {
          created_at: string
          id: string
          is_highlighted: boolean | null
          message: string
          message_type: string | null
          stream_id: string
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_highlighted?: boolean | null
          message: string
          message_type?: string | null
          stream_id: string
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_highlighted?: boolean | null
          message?: string
          message_type?: string | null
          stream_id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_chat_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_tips: {
        Row: {
          amount: number
          created_at: string
          creator_amount: number
          currency: string | null
          id: string
          message: string | null
          platform_fee: number
          stream_id: string
          stripe_payment_id: string | null
          tipper_id: string | null
          tipper_name: string
        }
        Insert: {
          amount: number
          created_at?: string
          creator_amount: number
          currency?: string | null
          id?: string
          message?: string | null
          platform_fee: number
          stream_id: string
          stripe_payment_id?: string | null
          tipper_id?: string | null
          tipper_name: string
        }
        Update: {
          amount?: number
          created_at?: string
          creator_amount?: number
          currency?: string | null
          id?: string
          message?: string | null
          platform_fee?: number
          stream_id?: string
          stripe_payment_id?: string | null
          tipper_id?: string | null
          tipper_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_tips_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_viewers: {
        Row: {
          id: string
          joined_at: string
          left_at: string | null
          stream_id: string
          viewer_id: string | null
          viewer_name: string | null
          watch_duration: number | null
        }
        Insert: {
          id?: string
          joined_at?: string
          left_at?: string | null
          stream_id: string
          viewer_id?: string | null
          viewer_name?: string | null
          watch_duration?: number | null
        }
        Update: {
          id?: string
          joined_at?: string
          left_at?: string | null
          stream_id?: string
          viewer_id?: string | null
          viewer_name?: string | null
          watch_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_viewers_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      streams: {
        Row: {
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          is_recording: boolean | null
          peak_viewers: number | null
          recording_url: string | null
          room_name: string | null
          room_url: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          thumbnail_url: string | null
          title: string
          total_tips: number | null
          updated_at: string
          user_id: string
          viewer_count: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          is_recording?: boolean | null
          peak_viewers?: number | null
          recording_url?: string | null
          room_name?: string | null
          room_url?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          total_tips?: number | null
          updated_at?: string
          user_id: string
          viewer_count?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          is_recording?: boolean | null
          peak_viewers?: number | null
          recording_url?: string | null
          room_name?: string | null
          room_url?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          total_tips?: number | null
          updated_at?: string
          user_id?: string
          viewer_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_links: {
        Args: { lookup_username: string }
        Returns: {
          id: string
          link_position: number
          link_type: string
          title: string
          url: string
        }[]
      }
      get_public_profile: {
        Args: { lookup_username: string }
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          username: string
        }[]
      }
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
