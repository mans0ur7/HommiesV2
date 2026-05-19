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
      blocked_users: {
        Row: {
          blocked_user_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          connection_type: string
          created_at: string
          id: string
          target_property_id: string | null
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          connection_type?: string
          created_at?: string
          id?: string
          target_property_id?: string | null
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          connection_type?: string
          created_at?: string
          id?: string
          target_property_id?: string | null
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          aconto: number | null
          created_at: string
          deposit: number | null
          end_date: string | null
          failure_reason: string | null
          house_rules: string | null
          id: string
          inventory_list: string | null
          is_furnished: boolean | null
          is_time_limited: boolean | null
          landlord_address: string | null
          landlord_cvr: string | null
          landlord_email: string | null
          landlord_id: string
          landlord_name: string | null
          landlord_phone: string | null
          landlord_signed_at: string | null
          maintenance_responsibility: string | null
          match_request_id: string | null
          monthly_rent: number | null
          notice_period_months: number | null
          payment_account: string | null
          payment_day: number | null
          penneo_case_id: string | null
          penneo_signing_url_landlord: string | null
          penneo_signing_url_tenant: string | null
          pets_allowed: boolean | null
          pets_description: string | null
          prepaid_rent: number | null
          property_address: string | null
          property_city: string | null
          property_id: string
          property_postal_code: string | null
          property_room_count: number | null
          property_size_sqm: number | null
          property_type: string | null
          ready_at: string | null
          sent_to_penneo_at: string | null
          signed_at: string | null
          signed_document_url: string | null
          smoking_allowed: boolean | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          subletting_allowed: boolean | null
          tenant_address: string | null
          tenant_confirmed_at: string | null
          tenant_email: string | null
          tenant_id: string
          tenant_name: string | null
          tenant_phone: string | null
          tenant_signed_at: string | null
          updated_at: string
        }
        Insert: {
          aconto?: number | null
          created_at?: string
          deposit?: number | null
          end_date?: string | null
          failure_reason?: string | null
          house_rules?: string | null
          id?: string
          inventory_list?: string | null
          is_furnished?: boolean | null
          is_time_limited?: boolean | null
          landlord_address?: string | null
          landlord_cvr?: string | null
          landlord_email?: string | null
          landlord_id: string
          landlord_name?: string | null
          landlord_phone?: string | null
          landlord_signed_at?: string | null
          maintenance_responsibility?: string | null
          match_request_id?: string | null
          monthly_rent?: number | null
          notice_period_months?: number | null
          payment_account?: string | null
          payment_day?: number | null
          penneo_case_id?: string | null
          penneo_signing_url_landlord?: string | null
          penneo_signing_url_tenant?: string | null
          pets_allowed?: boolean | null
          pets_description?: string | null
          prepaid_rent?: number | null
          property_address?: string | null
          property_city?: string | null
          property_id: string
          property_postal_code?: string | null
          property_room_count?: number | null
          property_size_sqm?: number | null
          property_type?: string | null
          ready_at?: string | null
          sent_to_penneo_at?: string | null
          signed_at?: string | null
          signed_document_url?: string | null
          smoking_allowed?: boolean | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          subletting_allowed?: boolean | null
          tenant_address?: string | null
          tenant_confirmed_at?: string | null
          tenant_email?: string | null
          tenant_id: string
          tenant_name?: string | null
          tenant_phone?: string | null
          tenant_signed_at?: string | null
          updated_at?: string
        }
        Update: {
          aconto?: number | null
          created_at?: string
          deposit?: number | null
          end_date?: string | null
          failure_reason?: string | null
          house_rules?: string | null
          id?: string
          inventory_list?: string | null
          is_furnished?: boolean | null
          is_time_limited?: boolean | null
          landlord_address?: string | null
          landlord_cvr?: string | null
          landlord_email?: string | null
          landlord_id?: string
          landlord_name?: string | null
          landlord_phone?: string | null
          landlord_signed_at?: string | null
          maintenance_responsibility?: string | null
          match_request_id?: string | null
          monthly_rent?: number | null
          notice_period_months?: number | null
          payment_account?: string | null
          payment_day?: number | null
          penneo_case_id?: string | null
          penneo_signing_url_landlord?: string | null
          penneo_signing_url_tenant?: string | null
          pets_allowed?: boolean | null
          pets_description?: string | null
          prepaid_rent?: number | null
          property_address?: string | null
          property_city?: string | null
          property_id?: string
          property_postal_code?: string | null
          property_room_count?: number | null
          property_size_sqm?: number | null
          property_type?: string | null
          ready_at?: string | null
          sent_to_penneo_at?: string | null
          signed_at?: string | null
          signed_document_url?: string | null
          smoking_allowed?: boolean | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          subletting_allowed?: boolean | null
          tenant_address?: string | null
          tenant_confirmed_at?: string | null
          tenant_email?: string | null
          tenant_id?: string
          tenant_name?: string | null
          tenant_phone?: string | null
          tenant_signed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_match_request_id_fkey"
            columns: ["match_request_id"]
            isOneToOne: false
            referencedRelation: "match_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          property_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          property_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          property_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "housing_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      group_requests: {
        Row: {
          created_at: string
          desired_rooms: number | null
          group_id: string
          id: string
          landlord_id: string
          message: string | null
          property_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          desired_rooms?: number | null
          group_id: string
          id?: string
          landlord_id: string
          message?: string | null
          property_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          desired_rooms?: number | null
          group_id?: string
          id?: string
          landlord_id?: string
          message?: string | null
          property_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "housing_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      housing_group_members: {
        Row: {
          group_id: string
          id: string
          invited_at: string
          invited_by: string
          responded_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          invited_at?: string
          invited_by: string
          responded_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          invited_at?: string
          invited_by?: string
          responded_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "housing_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "housing_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      housing_groups: {
        Row: {
          area: string | null
          budget_per_person: number | null
          budget_total: number | null
          city: string | null
          created_at: string
          created_by: string
          desired_rooms: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          budget_per_person?: number | null
          budget_total?: number | null
          city?: string | null
          created_at?: string
          created_by: string
          desired_rooms?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          budget_per_person?: number | null
          budget_total?: number | null
          city?: string | null
          created_at?: string
          created_by?: string
          desired_rooms?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ignored: {
        Row: {
          created_at: string
          id: string
          target_property_id: string | null
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_property_id?: string | null
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_property_id?: string | null
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      match_requests: {
        Row: {
          created_at: string
          id: string
          property_id: string | null
          receiver_id: string
          sender_id: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id?: string | null
          receiver_id: string
          sender_id: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          is_read: boolean
          message: string | null
          property_id: string | null
          search_agent_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          property_id?: string | null
          search_agent_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          property_id?: string | null
          search_agent_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_search_agent_id_fkey"
            columns: ["search_agent_id"]
            isOneToOne: false
            referencedRelation: "search_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          gender: string | null
          hidden_from_explore: boolean
          id: string
          images: string[] | null
          languages: string[] | null
          lifestyle: string[] | null
          monthly_budget: number | null
          name: string
          nationality: string | null
          personality: string[] | null
          rental_period: string | null
          study: string | null
          updated_at: string
          user_id: string
          user_type: string | null
          work: string | null
          work_other: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          gender?: string | null
          hidden_from_explore?: boolean
          id?: string
          images?: string[] | null
          languages?: string[] | null
          lifestyle?: string[] | null
          monthly_budget?: number | null
          name: string
          nationality?: string | null
          personality?: string[] | null
          rental_period?: string | null
          study?: string | null
          updated_at?: string
          user_id: string
          user_type?: string | null
          work?: string | null
          work_other?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          gender?: string | null
          hidden_from_explore?: boolean
          id?: string
          images?: string[] | null
          languages?: string[] | null
          lifestyle?: string[] | null
          monthly_budget?: number | null
          name?: string
          nationality?: string | null
          personality?: string[] | null
          rental_period?: string | null
          study?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
          work?: string | null
          work_other?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          aconto: number | null
          address: string
          amenities: string[] | null
          available_from: string | null
          available_rooms: number | null
          bathroom_count: number | null
          bed_count: number | null
          bills_included: boolean | null
          boost_expires_at: string | null
          boost_started_at: string | null
          bus_lines: string | null
          city: string
          created_at: string
          deposit: number | null
          description: string | null
          expires_at: string | null
          female_count: number | null
          floor_plan_url: string | null
          gender_composition: string | null
          has_kitchen: boolean | null
          has_private_bathroom: boolean | null
          has_private_kitchen: boolean | null
          id: string
          images: string[] | null
          is_furnished: boolean | null
          is_multi_room: boolean | null
          is_published: boolean | null
          listing_period: number | null
          living_area_count: number | null
          male_count: number | null
          max_occupants: number | null
          metro_lines: string[] | null
          min_stay: string | null
          monthly_rent: number
          postal_code: string | null
          property_type: string | null
          rating_average: number | null
          rating_count: number | null
          room_count: number | null
          s_train_lines: string[] | null
          size_sqm: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
          utility_cost: number | null
        }
        Insert: {
          aconto?: number | null
          address: string
          amenities?: string[] | null
          available_from?: string | null
          available_rooms?: number | null
          bathroom_count?: number | null
          bed_count?: number | null
          bills_included?: boolean | null
          boost_expires_at?: string | null
          boost_started_at?: string | null
          bus_lines?: string | null
          city: string
          created_at?: string
          deposit?: number | null
          description?: string | null
          expires_at?: string | null
          female_count?: number | null
          floor_plan_url?: string | null
          gender_composition?: string | null
          has_kitchen?: boolean | null
          has_private_bathroom?: boolean | null
          has_private_kitchen?: boolean | null
          id?: string
          images?: string[] | null
          is_furnished?: boolean | null
          is_multi_room?: boolean | null
          is_published?: boolean | null
          listing_period?: number | null
          living_area_count?: number | null
          male_count?: number | null
          max_occupants?: number | null
          metro_lines?: string[] | null
          min_stay?: string | null
          monthly_rent: number
          postal_code?: string | null
          property_type?: string | null
          rating_average?: number | null
          rating_count?: number | null
          room_count?: number | null
          s_train_lines?: string[] | null
          size_sqm?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          utility_cost?: number | null
        }
        Update: {
          aconto?: number | null
          address?: string
          amenities?: string[] | null
          available_from?: string | null
          available_rooms?: number | null
          bathroom_count?: number | null
          bed_count?: number | null
          bills_included?: boolean | null
          boost_expires_at?: string | null
          boost_started_at?: string | null
          bus_lines?: string | null
          city?: string
          created_at?: string
          deposit?: number | null
          description?: string | null
          expires_at?: string | null
          female_count?: number | null
          floor_plan_url?: string | null
          gender_composition?: string | null
          has_kitchen?: boolean | null
          has_private_bathroom?: boolean | null
          has_private_kitchen?: boolean | null
          id?: string
          images?: string[] | null
          is_furnished?: boolean | null
          is_multi_room?: boolean | null
          is_published?: boolean | null
          listing_period?: number | null
          living_area_count?: number | null
          male_count?: number | null
          max_occupants?: number | null
          metro_lines?: string[] | null
          min_stay?: string | null
          monthly_rent?: number
          postal_code?: string | null
          property_type?: string | null
          rating_average?: number | null
          rating_count?: number | null
          room_count?: number | null
          s_train_lines?: string[] | null
          size_sqm?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          utility_cost?: number | null
        }
        Relationships: []
      }
      property_reports: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_resolved: boolean | null
          property_id: string
          reason: string
          reporter_user_id: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          property_id: string
          reason: string
          reporter_user_id: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          property_id?: string
          reason?: string
          reporter_user_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          match_request_id: string | null
          property_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          match_request_id?: string | null
          property_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          match_request_id?: string | null
          property_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_match_request_id_fkey"
            columns: ["match_request_id"]
            isOneToOne: false
            referencedRelation: "match_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      search_agents: {
        Row: {
          area: string | null
          city: string | null
          created_at: string
          email_notifications: boolean
          id: string
          is_active: boolean
          last_checked_at: string | null
          max_rent: number | null
          max_rooms: number | null
          min_rent: number | null
          min_rooms: number | null
          name: string
          notification_frequency: string
          property_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: string | null
          city?: string | null
          created_at?: string
          email_notifications?: boolean
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          max_rent?: number | null
          max_rooms?: number | null
          min_rent?: number | null
          min_rooms?: number | null
          name: string
          notification_frequency?: string
          property_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string | null
          city?: string | null
          created_at?: string
          email_notifications?: boolean
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          max_rent?: number | null
          max_rooms?: number | null
          min_rent?: number | null
          min_rooms?: number | null
          name?: string
          notification_frequency?: string
          property_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      views: {
        Row: {
          created_at: string
          id: string
          target_property_id: string | null
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_property_id?: string | null
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_property_id?: string | null
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "views_target_property_id_fkey"
            columns: ["target_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_creator: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_housing_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      landlord_has_group_request: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      contract_status:
        | "draft"
        | "ready"
        | "tenant_confirmed"
        | "sent_to_penneo"
        | "partially_signed"
        | "signed"
        | "signing_failed"
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
      contract_status: [
        "draft",
        "ready",
        "tenant_confirmed",
        "sent_to_penneo",
        "partially_signed",
        "signed",
        "signing_failed",
      ],
    },
  },
} as const
