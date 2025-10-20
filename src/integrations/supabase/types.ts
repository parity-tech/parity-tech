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
      activity_events: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          company_id: string
          created_at: string
          department_id: string | null
          duration_seconds: number | null
          external_id: string | null
          external_system: Database["public"]["Enums"]["external_system"] | null
          id: string
          metadata: Json | null
          timestamp: string
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          company_id: string
          created_at?: string
          department_id?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          external_system?:
            | Database["public"]["Enums"]["external_system"]
            | null
          id?: string
          metadata?: Json | null
          timestamp?: string
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          company_id?: string
          created_at?: string
          department_id?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          external_system?:
            | Database["public"]["Enums"]["external_system"]
            | null
          id?: string
          metadata?: Json | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_events: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          ai_suggested_actions: string | null
          alert_id: string
          company_id: string
          corrective_action_document: string | null
          created_at: string
          id: string
          risk_level: string | null
          risk_score: number | null
          triggered_by_data: Json
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          ai_suggested_actions?: string | null
          alert_id: string
          company_id: string
          corrective_action_document?: string | null
          created_at?: string
          id?: string
          risk_level?: string | null
          risk_score?: number | null
          triggered_by_data: Json
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          ai_suggested_actions?: string | null
          alert_id?: string
          company_id?: string
          corrective_action_document?: string | null
          created_at?: string
          id?: string
          risk_level?: string | null
          risk_score?: number | null
          triggered_by_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "alert_events_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          company_id: string
          conditions: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          notify_users: string[] | null
          priority: Database["public"]["Enums"]["alert_priority"]
          risk_level: string | null
          risk_score: number | null
          title: string
          triggered_count: number | null
          type: Database["public"]["Enums"]["alert_type"]
          updated_at: string
        }
        Insert: {
          company_id: string
          conditions: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          notify_users?: string[] | null
          priority?: Database["public"]["Enums"]["alert_priority"]
          risk_level?: string | null
          risk_score?: number | null
          title: string
          triggered_count?: number | null
          type: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          notify_users?: string[] | null
          priority?: Database["public"]["Enums"]["alert_priority"]
          risk_level?: string | null
          risk_score?: number | null
          title?: string
          triggered_count?: number | null
          type?: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      api_integration_logs: {
        Row: {
          company_id: string
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          integration_id: string
          method: string
          request_payload: Json | null
          response_payload: Json | null
          response_time_ms: number | null
          status_code: number | null
          success: boolean
        }
        Insert: {
          company_id: string
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          integration_id: string
          method: string
          request_payload?: Json | null
          response_payload?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          success: boolean
        }
        Update: {
          company_id?: string
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          integration_id?: string
          method?: string
          request_payload?: Json | null
          response_payload?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "api_integration_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_integration_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "api_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_integrations: {
        Row: {
          auth_type: string
          base_url: string
          company_id: string
          created_at: string
          created_by: string | null
          credentials_encrypted: string | null
          headers: Json | null
          id: string
          last_error_at: string | null
          last_success_at: string | null
          metadata: Json | null
          name: string
          retry_attempts: number | null
          status: Database["public"]["Enums"]["integration_status"]
          timeout_seconds: number | null
          type: Database["public"]["Enums"]["integration_type"]
          updated_at: string
        }
        Insert: {
          auth_type: string
          base_url: string
          company_id: string
          created_at?: string
          created_by?: string | null
          credentials_encrypted?: string | null
          headers?: Json | null
          id?: string
          last_error_at?: string | null
          last_success_at?: string | null
          metadata?: Json | null
          name: string
          retry_attempts?: number | null
          status?: Database["public"]["Enums"]["integration_status"]
          timeout_seconds?: number | null
          type: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
        }
        Update: {
          auth_type?: string
          base_url?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          credentials_encrypted?: string | null
          headers?: Json | null
          id?: string
          last_error_at?: string | null
          last_success_at?: string | null
          metadata?: Json | null
          name?: string
          retry_attempts?: number | null
          status?: Database["public"]["Enums"]["integration_status"]
          timeout_seconds?: number | null
          type?: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      benefit_partners: {
        Row: {
          benefit_types: string[]
          category: Database["public"]["Enums"]["benefit_category"]
          company_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          benefit_types: string[]
          category: Database["public"]["Enums"]["benefit_category"]
          company_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          benefit_types?: string[]
          category?: Database["public"]["Enums"]["benefit_category"]
          company_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benefit_partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      benefit_voucher_usage: {
        Row: {
          company_id: string
          dependent_id: string | null
          id: string
          notes: string | null
          used_at: string
          user_id: string
          voucher_id: string
        }
        Insert: {
          company_id: string
          dependent_id?: string | null
          id?: string
          notes?: string | null
          used_at?: string
          user_id: string
          voucher_id: string
        }
        Update: {
          company_id?: string
          dependent_id?: string | null
          id?: string
          notes?: string | null
          used_at?: string
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_voucher_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_voucher_usage_dependent_id_fkey"
            columns: ["dependent_id"]
            isOneToOne: false
            referencedRelation: "dependents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_voucher_usage_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "benefit_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      benefit_vouchers: {
        Row: {
          applicable_to: Database["public"]["Enums"]["dependent_type"][] | null
          benefit_type: string
          category: Database["public"]["Enums"]["benefit_category"]
          company_id: string
          created_at: string
          description: string | null
          discount_percentage: number | null
          discount_value_cents: number | null
          id: string
          is_active: boolean
          max_uses_per_user: number | null
          partner_id: string | null
          redemption_instructions: string | null
          title: string
          updated_at: string
          valid_until: string | null
          voucher_code: string | null
        }
        Insert: {
          applicable_to?: Database["public"]["Enums"]["dependent_type"][] | null
          benefit_type: string
          category: Database["public"]["Enums"]["benefit_category"]
          company_id: string
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          discount_value_cents?: number | null
          id?: string
          is_active?: boolean
          max_uses_per_user?: number | null
          partner_id?: string | null
          redemption_instructions?: string | null
          title: string
          updated_at?: string
          valid_until?: string | null
          voucher_code?: string | null
        }
        Update: {
          applicable_to?: Database["public"]["Enums"]["dependent_type"][] | null
          benefit_type?: string
          category?: Database["public"]["Enums"]["benefit_category"]
          company_id?: string
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          discount_value_cents?: number | null
          id?: string
          is_active?: boolean
          max_uses_per_user?: number | null
          partner_id?: string | null
          redemption_instructions?: string | null
          title?: string
          updated_at?: string
          valid_until?: string | null
          voucher_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benefit_vouchers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_vouchers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "benefit_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      corrective_actions: {
        Row: {
          alert_event_id: string
          alert_id: string
          company_id: string
          created_at: string | null
          created_by: string | null
          delivered_at: string | null
          department_id: string | null
          document_content: string
          document_path: string | null
          id: string
          occurrence_date: string
          occurrence_type: string
          signed_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_event_id: string
          alert_id: string
          company_id: string
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          department_id?: string | null
          document_content: string
          document_path?: string | null
          id?: string
          occurrence_date: string
          occurrence_type: string
          signed_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_event_id?: string
          alert_id?: string
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          department_id?: string | null
          document_content?: string
          document_path?: string | null
          id?: string
          occurrence_date?: string
          occurrence_type?: string
          signed_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corrective_actions_alert_event_id_fkey"
            columns: ["alert_event_id"]
            isOneToOne: false
            referencedRelation: "alert_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corrective_actions_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corrective_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corrective_actions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_permissions: {
        Row: {
          company_id: string
          created_at: string
          department_id: string
          has_access: boolean
          id: string
          metadata: Json | null
          system_name: string
          system_url: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id: string
          has_access?: boolean
          id?: string
          metadata?: Json | null
          system_name: string
          system_url?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string
          has_access?: boolean
          id?: string
          metadata?: Json | null
          system_name?: string
          system_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_permissions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          type: Database["public"]["Enums"]["department_type"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          type: Database["public"]["Enums"]["department_type"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["department_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      dependents: {
        Row: {
          birth_date: string | null
          company_id: string
          cpf: string | null
          created_at: string
          dependent_type: Database["public"]["Enums"]["dependent_type"]
          documents_path: string[] | null
          has_documents: boolean | null
          id: string
          name: string
          photo_url: string | null
          species: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          company_id: string
          cpf?: string | null
          created_at?: string
          dependent_type: Database["public"]["Enums"]["dependent_type"]
          documents_path?: string[] | null
          has_documents?: boolean | null
          id?: string
          name: string
          photo_url?: string | null
          species?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          company_id?: string
          cpf?: string | null
          created_at?: string
          dependent_type?: Database["public"]["Enums"]["dependent_type"]
          documents_path?: string[] | null
          has_documents?: boolean | null
          id?: string
          name?: string
          photo_url?: string | null
          species?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      download_logs: {
        Row: {
          access_location: string | null
          company_id: string
          contains_pii: boolean | null
          created_at: string
          device_info: Json | null
          download_timestamp: string
          file_name: string
          file_path: string
          file_size_bytes: number | null
          file_type: string | null
          id: string
          ip_address: unknown | null
          is_sensitive: boolean | null
          latitude: number | null
          lgpd_risk_score: number | null
          litigation_risk_score: number | null
          longitude: number | null
          overall_risk_level: Database["public"]["Enums"]["risk_level"] | null
          risk_factors: Json | null
          security_risk_score: number | null
          user_id: string
        }
        Insert: {
          access_location?: string | null
          company_id: string
          contains_pii?: boolean | null
          created_at?: string
          device_info?: Json | null
          download_timestamp?: string
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          ip_address?: unknown | null
          is_sensitive?: boolean | null
          latitude?: number | null
          lgpd_risk_score?: number | null
          litigation_risk_score?: number | null
          longitude?: number | null
          overall_risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_factors?: Json | null
          security_risk_score?: number | null
          user_id: string
        }
        Update: {
          access_location?: string | null
          company_id?: string
          contains_pii?: boolean | null
          created_at?: string
          device_info?: Json | null
          download_timestamp?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          ip_address?: unknown | null
          is_sensitive?: boolean | null
          latitude?: number | null
          lgpd_risk_score?: number | null
          litigation_risk_score?: number | null
          longitude?: number | null
          overall_risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_factors?: Json | null
          security_risk_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_threads: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string
          created_by: string
          department_id: string | null
          description: string
          id: string
          parent_thread_id: string | null
          priority: number | null
          status: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string
          created_by: string
          department_id?: string | null
          description: string
          id?: string
          parent_thread_id?: string | null
          priority?: number | null
          status?: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string
          id?: string
          parent_thread_id?: string | null
          priority?: number | null
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_threads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_threads_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_threads_parent_thread_id_fkey"
            columns: ["parent_thread_id"]
            isOneToOne: false
            referencedRelation: "feedback_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_achievements: {
        Row: {
          achievement_percentage: number | null
          calculated_at: string
          company_id: string
          created_at: string
          current_value: number
          department_id: string | null
          goal_id: string
          id: string
          is_achieved: boolean | null
          period_end: string
          period_start: string
          target_value: number
          user_id: string | null
        }
        Insert: {
          achievement_percentage?: number | null
          calculated_at?: string
          company_id: string
          created_at?: string
          current_value?: number
          department_id?: string | null
          goal_id: string
          id?: string
          is_achieved?: boolean | null
          period_end: string
          period_start: string
          target_value: number
          user_id?: string | null
        }
        Update: {
          achievement_percentage?: number | null
          calculated_at?: string
          company_id?: string
          created_at?: string
          current_value?: number
          department_id?: string | null
          goal_id?: string
          id?: string
          is_achieved?: boolean | null
          period_end?: string
          period_start?: string
          target_value?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_achievements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_achievements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_achievements_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          metric_type: Database["public"]["Enums"]["goal_metric_type"]
          name: string
          period: Database["public"]["Enums"]["goal_period"]
          start_date: string
          target_value: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          metric_type: Database["public"]["Enums"]["goal_metric_type"]
          name: string
          period: Database["public"]["Enums"]["goal_period"]
          start_date: string
          target_value: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          metric_type?: Database["public"]["Enums"]["goal_metric_type"]
          name?: string
          period?: Database["public"]["Enums"]["goal_period"]
          start_date?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_content: {
        Row: {
          company_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          duration_minutes: number | null
          external_url: string | null
          id: string
          is_active: boolean
          learning_path_id: string
          metadata: Json | null
          order_index: number
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          duration_minutes?: number | null
          external_url?: string | null
          id?: string
          is_active?: boolean
          learning_path_id: string
          metadata?: Json | null
          order_index?: number
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          duration_minutes?: number | null
          external_url?: string | null
          id?: string
          is_active?: boolean
          learning_path_id?: string
          metadata?: Json | null
          order_index?: number
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_content_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_content_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean
          is_mandatory: boolean
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_progress: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          last_accessed_at: string
          learning_content_id: string
          learning_path_id: string
          progress_percentage: number
          time_spent_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          last_accessed_at?: string
          learning_content_id: string
          learning_path_id: string
          progress_percentage?: number
          time_spent_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          last_accessed_at?: string
          learning_content_id?: string
          learning_path_id?: string
          progress_percentage?: number
          time_spent_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_progress_learning_content_id_fkey"
            columns: ["learning_content_id"]
            isOneToOne: false
            referencedRelation: "learning_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_progress_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      login_locations: {
        Row: {
          city: string | null
          company_id: string
          country: string | null
          country_code: string | null
          created_at: string
          device_info: Json | null
          id: string
          ip_address: unknown
          is_suspicious: boolean | null
          isp: string | null
          latitude: number | null
          longitude: number | null
          region: string | null
          suspicious_reason: string | null
          timezone: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          company_id: string
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_info?: Json | null
          id?: string
          ip_address: unknown
          is_suspicious?: boolean | null
          isp?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          suspicious_reason?: string | null
          timezone?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          company_id?: string
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_info?: Json | null
          id?: string
          ip_address?: unknown
          is_suspicious?: boolean | null
          isp?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          suspicious_reason?: string | null
          timezone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_certificates: {
        Row: {
          certificate_number: string | null
          company_id: string
          created_at: string
          days_count: number
          doctor_crm: string | null
          doctor_name: string | null
          document_path: string | null
          end_date: string
          id: string
          is_suspicious: boolean | null
          issue_date: string
          medical_reason: string | null
          review_date: string | null
          review_notes: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["certificate_status"]
          suspicious_reasons: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_number?: string | null
          company_id: string
          created_at?: string
          days_count: number
          doctor_crm?: string | null
          doctor_name?: string | null
          document_path?: string | null
          end_date: string
          id?: string
          is_suspicious?: boolean | null
          issue_date: string
          medical_reason?: string | null
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["certificate_status"]
          suspicious_reasons?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_number?: string | null
          company_id?: string
          created_at?: string
          days_count?: number
          doctor_crm?: string | null
          doctor_name?: string | null
          document_path?: string | null
          end_date?: string
          id?: string
          is_suspicious?: boolean | null
          issue_date?: string
          medical_reason?: string | null
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["certificate_status"]
          suspicious_reasons?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_certificates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_leave_extensions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          certificate_id: string
          company_id: string
          created_at: string
          extension_days: number
          id: string
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          certificate_id: string
          company_id: string
          created_at?: string
          extension_days?: number
          id?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          certificate_id?: string
          company_id?: string
          created_at?: string
          extension_days?: number
          id?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_leave_extensions_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "medical_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_leave_extensions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      overtime_records: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          department_id: string | null
          expected_hours: number
          has_alert: boolean | null
          has_overtime_approval: boolean | null
          id: string
          overtime_hours: number | null
          overtime_reason: string | null
          record_date: string
          regular_hours: number | null
          risk_score: number | null
          undertime_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          department_id?: string | null
          expected_hours?: number
          has_alert?: boolean | null
          has_overtime_approval?: boolean | null
          id?: string
          overtime_hours?: number | null
          overtime_reason?: string | null
          record_date: string
          regular_hours?: number | null
          risk_score?: number | null
          undertime_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          department_id?: string | null
          expected_hours?: number
          has_alert?: boolean | null
          has_overtime_approval?: boolean | null
          id?: string
          overtime_hours?: number | null
          overtime_reason?: string | null
          record_date?: string
          regular_hours?: number | null
          risk_score?: number | null
          undertime_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "overtime_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overtime_records_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string
          created_at: string
          department: string | null
          department_id: string | null
          full_name: string | null
          id: string
          position: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id: string
          created_at?: string
          department?: string | null
          department_id?: string | null
          full_name?: string | null
          id: string
          position?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string
          created_at?: string
          department?: string | null
          department_id?: string | null
          full_name?: string | null
          id?: string
          position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      reimbursement_documents: {
        Row: {
          company_id: string
          document_name: string
          document_path: string
          document_type: string
          file_size_bytes: number | null
          id: string
          is_valid: boolean | null
          reimbursement_id: string
          uploaded_at: string
          validation_notes: string | null
        }
        Insert: {
          company_id: string
          document_name: string
          document_path: string
          document_type: string
          file_size_bytes?: number | null
          id?: string
          is_valid?: boolean | null
          reimbursement_id: string
          uploaded_at?: string
          validation_notes?: string | null
        }
        Update: {
          company_id?: string
          document_name?: string
          document_path?: string
          document_type?: string
          file_size_bytes?: number | null
          id?: string
          is_valid?: boolean | null
          reimbursement_id?: string
          uploaded_at?: string
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reimbursement_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reimbursement_documents_reimbursement_id_fkey"
            columns: ["reimbursement_id"]
            isOneToOne: false
            referencedRelation: "reimbursements"
            referencedColumns: ["id"]
          },
        ]
      }
      reimbursements: {
        Row: {
          amount: number
          category: string
          company_id: string
          created_at: string
          department_id: string | null
          description: string | null
          expense_date: string
          fraud_indicators: Json | null
          fraud_risk_level: Database["public"]["Enums"]["risk_level"] | null
          fraud_risk_score: number | null
          has_all_documents: boolean | null
          id: string
          missing_documents: Json | null
          review_date: string | null
          review_notes: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["reimbursement_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          company_id: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          expense_date: string
          fraud_indicators?: Json | null
          fraud_risk_level?: Database["public"]["Enums"]["risk_level"] | null
          fraud_risk_score?: number | null
          has_all_documents?: boolean | null
          id?: string
          missing_documents?: Json | null
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["reimbursement_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          company_id?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          expense_date?: string
          fraud_indicators?: Json | null
          fraud_risk_level?: Database["public"]["Enums"]["risk_level"] | null
          fraud_risk_score?: number | null
          has_all_documents?: boolean | null
          id?: string
          missing_documents?: Json | null
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["reimbursement_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reimbursements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reimbursements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          company_id: string
          created_at: string
          data_snapshot: Json | null
          description: string | null
          file_url: string | null
          filters: Json | null
          generated_by: string | null
          id: string
          report_type: string
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data_snapshot?: Json | null
          description?: string | null
          file_url?: string | null
          filters?: Json | null
          generated_by?: string | null
          id?: string
          report_type: string
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data_snapshot?: Json | null
          description?: string | null
          file_url?: string | null
          filters?: Json | null
          generated_by?: string | null
          id?: string
          report_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          actual_time: string
          company_id: string
          created_at: string
          device_info: Json | null
          distance_from_expected_meters: number | null
          expected_location_lat: number | null
          expected_location_lng: number | null
          expected_time: string | null
          has_irregularity: boolean | null
          id: string
          ip_address: unknown | null
          irregularity_reason: string | null
          is_late: boolean | null
          latitude: number | null
          location_address: string | null
          location_risk_score: number | null
          log_date: string
          log_type: Database["public"]["Enums"]["time_log_type"]
          longitude: number | null
          minutes_difference: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_time: string
          company_id: string
          created_at?: string
          device_info?: Json | null
          distance_from_expected_meters?: number | null
          expected_location_lat?: number | null
          expected_location_lng?: number | null
          expected_time?: string | null
          has_irregularity?: boolean | null
          id?: string
          ip_address?: unknown | null
          irregularity_reason?: string | null
          is_late?: boolean | null
          latitude?: number | null
          location_address?: string | null
          location_risk_score?: number | null
          log_date: string
          log_type: Database["public"]["Enums"]["time_log_type"]
          longitude?: number | null
          minutes_difference?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_time?: string
          company_id?: string
          created_at?: string
          device_info?: Json | null
          distance_from_expected_meters?: number | null
          expected_location_lat?: number | null
          expected_location_lng?: number | null
          expected_time?: string | null
          has_irregularity?: boolean | null
          id?: string
          ip_address?: unknown | null
          irregularity_reason?: string | null
          is_late?: boolean | null
          latitude?: number | null
          location_address?: string | null
          location_risk_score?: number | null
          log_date?: string
          log_type?: Database["public"]["Enums"]["time_log_type"]
          longitude?: number | null
          minutes_difference?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_challenge_participations: {
        Row: {
          challenge_id: string
          company_id: string
          completed_at: string | null
          id: string
          joined_at: string
          points_earned: number | null
          progress_percentage: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          company_id: string
          completed_at?: string | null
          id?: string
          joined_at?: string
          points_earned?: number | null
          progress_percentage?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          company_id?: string
          completed_at?: string | null
          id?: string
          joined_at?: string
          points_earned?: number | null
          progress_percentage?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_challenge_participations_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "wellness_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellness_challenge_participations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_challenges: {
        Row: {
          category: string
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          external_id: string | null
          external_source: string | null
          id: string
          is_active: boolean
          max_participants: number | null
          points_reward: number
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          is_active?: boolean
          max_participants?: number | null
          points_reward?: number
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          is_active?: boolean
          max_participants?: number | null
          points_reward?: number
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_challenges_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_points_balance: {
        Row: {
          available_points: number
          company_id: string
          last_activity_at: string | null
          lifetime_points: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_points?: number
          company_id: string
          last_activity_at?: string | null
          lifetime_points?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_points?: number
          company_id?: string
          last_activity_at?: string | null
          lifetime_points?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_points_balance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_points_transactions: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          points_amount: number
          source_id: string | null
          source_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          points_amount: number
          source_id?: string | null
          source_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          points_amount?: number
          source_id?: string | null
          source_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_points_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_reward_redemptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          delivered_at: string | null
          delivery_details: Json | null
          id: string
          points_spent: number
          reward_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          delivered_at?: string | null
          delivery_details?: Json | null
          id?: string
          points_spent: number
          reward_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          delivered_at?: string | null
          delivery_details?: Json | null
          id?: string
          points_spent?: number
          reward_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_reward_redemptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellness_reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "wellness_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_rewards: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          max_per_user: number | null
          points_cost: number
          reward_details: Json | null
          reward_type: string
          stock_quantity: number | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_per_user?: number | null
          points_cost: number
          reward_details?: Json | null
          reward_type: string
          stock_quantity?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_per_user?: number | null
          points_cost?: number
          reward_details?: Json | null
          reward_type?: string
          stock_quantity?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_rewards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_settings: {
        Row: {
          company_id: string
          created_at: string
          expiration_months: number | null
          id: string
          min_points_for_redemption: number
          point_value_cents: number
          points_expire: boolean
          points_per_challenge: number
          points_per_health_activity: number
          points_per_meditation: number
          points_per_nutrition_log: number
          points_per_workout: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          expiration_months?: number | null
          id?: string
          min_points_for_redemption?: number
          point_value_cents?: number
          points_expire?: boolean
          points_per_challenge?: number
          points_per_health_activity?: number
          points_per_meditation?: number
          points_per_nutrition_log?: number
          points_per_workout?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          expiration_months?: number | null
          id?: string
          min_points_for_redemption?: number
          point_value_cents?: number
          points_expire?: boolean
          points_per_challenge?: number
          points_per_health_activity?: number
          points_per_meditation?: number
          points_per_nutrition_log?: number
          points_per_workout?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_default_departments: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      get_user_company_id: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_department_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _company_id?: string
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "call"
        | "email"
        | "ticket"
        | "system_access"
        | "meeting"
        | "task"
      alert_priority: "baixa" | "media" | "alta" | "critica"
      alert_type:
        | "login_suspeito"
        | "api_erro"
        | "api_lento"
        | "uso_anormal"
        | "personalizado"
      benefit_category: "saude" | "lazer" | "educacao"
      certificate_status: "pendente" | "aprovado" | "rejeitado"
      content_type: "video" | "pdf" | "quiz" | "external_link"
      department_type:
        | "administrativo"
        | "comercial"
        | "operacoes"
        | "ti"
        | "financeiro"
        | "rh"
        | "juridico"
        | "vendas"
        | "marketing"
        | "producao"
        | "logistica"
        | "qualidade"
        | "infraestrutura"
        | "desenvolvimento"
      dependent_type: "pet" | "filho"
      external_system:
        | "erp"
        | "crm"
        | "helpdesk"
        | "phone_system"
        | "email_system"
        | "project_management"
      feedback_status: "aberto" | "em_analise" | "implementado" | "rejeitado"
      goal_metric_type:
        | "tickets_resolved"
        | "calls_made"
        | "emails_sent"
        | "meetings_attended"
        | "tasks_completed"
        | "custom"
      goal_period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
      integration_status: "ativo" | "inativo" | "erro" | "pendente"
      integration_type: "erp" | "crm" | "financeiro" | "rh" | "outro"
      reimbursement_status: "pendente" | "em_analise" | "aprovado" | "rejeitado"
      risk_level: "baixo" | "medio" | "alto" | "critico"
      time_log_type: "entrada" | "saida_almoco" | "retorno_almoco" | "saida"
      user_role: "admin" | "gestor" | "usuario"
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
      activity_type: [
        "call",
        "email",
        "ticket",
        "system_access",
        "meeting",
        "task",
      ],
      alert_priority: ["baixa", "media", "alta", "critica"],
      alert_type: [
        "login_suspeito",
        "api_erro",
        "api_lento",
        "uso_anormal",
        "personalizado",
      ],
      benefit_category: ["saude", "lazer", "educacao"],
      certificate_status: ["pendente", "aprovado", "rejeitado"],
      content_type: ["video", "pdf", "quiz", "external_link"],
      department_type: [
        "administrativo",
        "comercial",
        "operacoes",
        "ti",
        "financeiro",
        "rh",
        "juridico",
        "vendas",
        "marketing",
        "producao",
        "logistica",
        "qualidade",
        "infraestrutura",
        "desenvolvimento",
      ],
      dependent_type: ["pet", "filho"],
      external_system: [
        "erp",
        "crm",
        "helpdesk",
        "phone_system",
        "email_system",
        "project_management",
      ],
      feedback_status: ["aberto", "em_analise", "implementado", "rejeitado"],
      goal_metric_type: [
        "tickets_resolved",
        "calls_made",
        "emails_sent",
        "meetings_attended",
        "tasks_completed",
        "custom",
      ],
      goal_period: ["daily", "weekly", "monthly", "quarterly", "yearly"],
      integration_status: ["ativo", "inativo", "erro", "pendente"],
      integration_type: ["erp", "crm", "financeiro", "rh", "outro"],
      reimbursement_status: ["pendente", "em_analise", "aprovado", "rejeitado"],
      risk_level: ["baixo", "medio", "alto", "critico"],
      time_log_type: ["entrada", "saida_almoco", "retorno_almoco", "saida"],
      user_role: ["admin", "gestor", "usuario"],
    },
  },
} as const
