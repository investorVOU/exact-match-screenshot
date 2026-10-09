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
      car_images: {
        Row: {
          car_id: string
          id: string
          path: string | null
          position: number
          url: string
        }
        Insert: {
          car_id: string
          id?: string
          path?: string | null
          position?: number
          url: string
        }
        Update: {
          car_id?: string
          id?: string
          path?: string | null
          position?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_images_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_requests: {
        Row: {
          budget: string | null
          car_wanted: string
          created_at: string
          id: string
          name: string
          phone: string
          status: string
          type: string | null
        }
        Insert: {
          budget?: string | null
          car_wanted: string
          created_at?: string
          id?: string
          name: string
          phone: string
          status?: string
          type?: string | null
        }
        Update: {
          budget?: string | null
          car_wanted?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string
          status?: string
          type?: string | null
        }
        Relationships: []
      }
      cars: {
        Row: {
          body_type: string
          color: string | null
          condition: string
          created_at: string
          description: string | null
          engine_size: string | null
          fuel: string
          id: string
          location: string
          make: string
          mileage: number
          model: string
          original_customs_duty: boolean
          price: number
          slug: string
          status: string
          transmission: string
          year: number
        }
        Insert: {
          body_type?: string
          color?: string | null
          condition?: string
          created_at?: string
          description?: string | null
          engine_size?: string | null
          fuel?: string
          id?: string
          location?: string
          make: string
          mileage?: number
          model: string
          original_customs_duty?: boolean
          price: number
          slug: string
          status?: string
          transmission?: string
          year: number
        }
        Update: {
          body_type?: string
          color?: string | null
          condition?: string
          created_at?: string
          description?: string | null
          engine_size?: string | null
          fuel?: string
          id?: string
          location?: string
          make?: string
          mileage?: number
          model?: string
          original_customs_duty?: boolean
          price?: number
          slug?: string
          status?: string
          transmission?: string
          year?: number
        }
        Relationships: []
      }
      customer_reviews: {
        Row: {
          approved: boolean
          car: string | null
          comment: string
          created_at: string
          id: string
          location: string | null
          name: string
          rating: number
        }
        Insert: {
          approved?: boolean
          car?: string | null
          comment: string
          created_at?: string
          id?: string
          location?: string | null
          name: string
          rating: number
        }
        Update: {
          approved?: boolean
          car?: string | null
          comment?: string
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          rating?: number
        }
        Relationships: []
      }
      inspection_requests: {
        Row: {
          car_id: string | null
          created_at: string
          id: string
          name: string
          preferred_date: string | null
          status: string
        }
        Insert: {
          car_id?: string | null
          created_at?: string
          id?: string
          name: string
          preferred_date?: string | null
          status?: string
        }
        Update: {
          car_id?: string | null
          created_at?: string
          id?: string
          name?: string
          preferred_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_requests_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          adsense_client_id: string
          google_analytics_id: string
          id: number
          pixel_id: string
          updated_at: string
        }
        Insert: {
          adsense_client_id?: string
          google_analytics_id?: string
          id?: number
          pixel_id?: string
          updated_at?: string
        }
        Update: {
          adsense_client_id?: string
          google_analytics_id?: string
          id?: number
          pixel_id?: string
          updated_at?: string
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
      admin_exists: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
