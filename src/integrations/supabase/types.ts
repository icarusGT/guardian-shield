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
      audit_log: {
        Row: {
          acted_at: string
          acted_by_user: string | null
          acted_ip: string | null
          action_type: Database["public"]["Enums"]["audit_action"]
          audit_id: number
          new_values: string | null
          old_values: string | null
          record_pk: string
          table_name: string
        }
        Insert: {
          acted_at?: string
          acted_by_user?: string | null
          acted_ip?: string | null
          action_type: Database["public"]["Enums"]["audit_action"]
          audit_id?: never
          new_values?: string | null
          old_values?: string | null
          record_pk: string
          table_name: string
        }
        Update: {
          acted_at?: string
          acted_by_user?: string | null
          acted_ip?: string | null
          action_type?: Database["public"]["Enums"]["audit_action"]
          audit_id?: never
          new_values?: string | null
          old_values?: string | null
          record_pk?: string
          table_name?: string
        }
        Relationships: []
      }
      case_assignments: {
        Row: {
          assigned_at: string
          assigned_by_user: string
          assignment_id: number
          case_id: number
          investigator_id: number
          note: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by_user: string
          assignment_id?: never
          case_id: number
          investigator_id: number
          note?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by_user?: string
          assignment_id?: never
          case_id?: number
          investigator_id?: number
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_assignments_assigned_by_user_fkey"
            columns: ["assigned_by_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "case_assignments_assigned_by_user_fkey"
            columns: ["assigned_by_user"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "case_assignments_assigned_by_user_fkey"
            columns: ["assigned_by_user"]
            isOneToOne: false
            referencedRelation: "v_case_assigned_investigator"
            referencedColumns: ["investigator_user_id"]
          },
          {
            foreignKeyName: "case_assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "fraud_cases"
            referencedColumns: ["case_id"]
          },
          {
            foreignKeyName: "case_assignments_investigator_id_fkey"
            columns: ["investigator_id"]
            isOneToOne: false
            referencedRelation: "investigators"
            referencedColumns: ["investigator_id"]
          },
          {
            foreignKeyName: "case_assignments_investigator_id_fkey"
            columns: ["investigator_id"]
            isOneToOne: false
            referencedRelation: "v_case_assigned_investigator"
            referencedColumns: ["investigator_id"]
          },
        ]
      }
      case_decisions: {
        Row: {
          admin_user_id: string
          case_id: number
          category: Database["public"]["Enums"]["decision_category"]
          created_at: string
          customer_message: string | null
          decision_id: number
          internal_notes: string | null
          status: Database["public"]["Enums"]["decision_status"]
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          case_id: number
          category: Database["public"]["Enums"]["decision_category"]
          created_at?: string
          customer_message?: string | null
          decision_id?: never
          internal_notes?: string | null
          status?: Database["public"]["Enums"]["decision_status"]
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          case_id?: number
          category?: Database["public"]["Enums"]["decision_category"]
          created_at?: string
          customer_message?: string | null
          decision_id?: never
          internal_notes?: string | null
          status?: Database["public"]["Enums"]["decision_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_decisions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "fraud_cases"
            referencedColumns: ["case_id"]
          },
        ]
      }
      case_feedback: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          case_id: number
          category: Database["public"]["Enums"]["feedback_category"]
          comment: string | null
          created_at: string
          feedback_id: number
          investigator_id: number
          updated_at: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          case_id: number
          category: Database["public"]["Enums"]["feedback_category"]
          comment?: string | null
          created_at?: string
          feedback_id?: never
          investigator_id: number
          updated_at?: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          case_id?: number
          category?: Database["public"]["Enums"]["feedback_category"]
          comment?: string | null
          created_at?: string
          feedback_id?: never
          investigator_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_feedback_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "fraud_cases"
            referencedColumns: ["case_id"]
          },
          {
            foreignKeyName: "case_feedback_investigator_id_fkey"
            columns: ["investigator_id"]
            isOneToOne: false
            referencedRelation: "investigators"
            referencedColumns: ["investigator_id"]
          },
          {
            foreignKeyName: "case_feedback_investigator_id_fkey"
            columns: ["investigator_id"]
            isOneToOne: false
            referencedRelation: "v_case_assigned_investigator"
            referencedColumns: ["investigator_id"]
          },
        ]
      }
      case_history: {
        Row: {
          case_id: number
          changed_at: string
          changed_by_user: string | null
          comment: string | null
          history_id: number
          new_status: Database["public"]["Enums"]["case_status"]
          old_status: Database["public"]["Enums"]["case_status"]
        }
        Insert: {
          case_id: number
          changed_at?: string
          changed_by_user?: string | null
          comment?: string | null
          history_id?: never
          new_status: Database["public"]["Enums"]["case_status"]
          old_status: Database["public"]["Enums"]["case_status"]
        }
        Update: {
          case_id?: number
          changed_at?: string
          changed_by_user?: string | null
          comment?: string | null
          history_id?: never
          new_status?: Database["public"]["Enums"]["case_status"]
          old_status?: Database["public"]["Enums"]["case_status"]
        }
        Relationships: [
          {
            foreignKeyName: "case_history_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "fraud_cases"
            referencedColumns: ["case_id"]
          },
        ]
      }
      case_messages: {
        Row: {
          case_id: number
          created_at: string
          message_body: string
          message_id: number
          seen_at: string | null
          sender_id: string
          sender_role: string
        }
        Insert: {
          case_id: number
          created_at?: string
          message_body: string
          message_id?: never
          seen_at?: string | null
          sender_id: string
          sender_role: string
        }
        Update: {
          case_id?: number
          created_at?: string
          message_body?: string
          message_id?: never
          seen_at?: string | null
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "fraud_cases"
            referencedColumns: ["case_id"]
          },
        ]
      }
      case_transactions: {
        Row: {
          case_id: number
          created_at: string
          txn_id: number
        }
        Insert: {
          case_id: number
          created_at?: string
          txn_id: number
        }
        Update: {
          case_id?: number
          created_at?: string
          txn_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_transactions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "fraud_cases"
            referencedColumns: ["case_id"]
          },
          {
            foreignKeyName: "case_transactions_txn_id_fkey"
            columns: ["txn_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["txn_id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          customer_id: number
          home_location: string | null
          nid_number: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: never
          home_location?: string | null
          nid_number?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: never
          home_location?: string | null
          nid_number?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_case_assigned_investigator"
            referencedColumns: ["investigator_user_id"]
          },
        ]
      }
      evidence_files: {
        Row: {
          case_id: number
          evidence_id: number
          file_path: string
          file_type: Database["public"]["Enums"]["evidence_type"]
          note: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          case_id: number
          evidence_id?: never
          file_path: string
          file_type?: Database["public"]["Enums"]["evidence_type"]
          note?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          case_id?: number
          evidence_id?: never
          file_path?: string
          file_type?: Database["public"]["Enums"]["evidence_type"]
          note?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_files_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "fraud_cases"
            referencedColumns: ["case_id"]
          },
          {
            foreignKeyName: "evidence_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evidence_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evidence_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_case_assigned_investigator"
            referencedColumns: ["investigator_user_id"]
          },
        ]
      }
      fraud_cases: {
        Row: {
          case_id: number
          category: Database["public"]["Enums"]["case_category"]
          closed_at: string | null
          created_at: string
          customer_id: number
          description: string | null
          severity: Database["public"]["Enums"]["severity_level"]
          status: Database["public"]["Enums"]["case_status"]
          title: string
        }
        Insert: {
          case_id?: never
          category?: Database["public"]["Enums"]["case_category"]
          closed_at?: string | null
          created_at?: string
          customer_id: number
          description?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          status?: Database["public"]["Enums"]["case_status"]
          title: string
        }
        Update: {
          case_id?: never
          category?: Database["public"]["Enums"]["case_category"]
          closed_at?: string | null
          created_at?: string
          customer_id?: number
          description?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          status?: Database["public"]["Enums"]["case_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_cases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fraud_cases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      fraud_rules: {
        Row: {
          amount_threshold: number | null
          description: string
          freq_count_limit: number | null
          freq_window_min: number | null
          is_active: boolean
          risk_points: number
          rule_code: string
          rule_id: number
        }
        Insert: {
          amount_threshold?: number | null
          description: string
          freq_count_limit?: number | null
          freq_window_min?: number | null
          is_active?: boolean
          risk_points?: number
          rule_code: string
          rule_id?: never
        }
        Update: {
          amount_threshold?: number | null
          description?: string
          freq_count_limit?: number | null
          freq_window_min?: number | null
          is_active?: boolean
          risk_points?: number
          rule_code?: string
          rule_id?: never
        }
        Relationships: []
      }
      investigators: {
        Row: {
          badge_no: string | null
          created_at: string
          department: string | null
          investigator_id: number
          is_available: boolean
          user_id: string
        }
        Insert: {
          badge_no?: string | null
          created_at?: string
          department?: string | null
          investigator_id?: never
          is_available?: boolean
          user_id: string
        }
        Update: {
          badge_no?: string | null
          created_at?: string
          department?: string | null
          investigator_id?: never
          is_available?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investigators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investigators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_case_assigned_investigator"
            referencedColumns: ["investigator_user_id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_id: number
          attempted_at: string
          ip_address: string | null
          success: boolean
          user_id: string
        }
        Insert: {
          attempt_id?: never
          attempted_at?: string
          ip_address?: string | null
          success: boolean
          user_id: string
        }
        Update: {
          attempt_id?: never
          attempted_at?: string
          ip_address?: string | null
          success?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "login_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "login_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_case_assigned_investigator"
            referencedColumns: ["investigator_user_id"]
          },
        ]
      }
      roles: {
        Row: {
          role_id: number
          role_name: string
        }
        Insert: {
          role_id?: never
          role_name: string
        }
        Update: {
          role_id?: never
          role_name?: string
        }
        Relationships: []
      }
      suspicious_transactions: {
        Row: {
          flagged_at: string
          reasons: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number
          suspicious_id: number
          txn_id: number
        }
        Insert: {
          flagged_at?: string
          reasons?: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number
          suspicious_id?: never
          txn_id: number
        }
        Update: {
          flagged_at?: string
          reasons?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          risk_score?: number
          suspicious_id?: never
          txn_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "suspicious_transactions_txn_id_fkey"
            columns: ["txn_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["txn_id"]
          },
        ]
      }
      transaction_decisions: {
        Row: {
          admin_user_id: string
          category: Database["public"]["Enums"]["decision_category"]
          created_at: string
          customer_message: string | null
          decision_id: number
          internal_notes: string | null
          status: Database["public"]["Enums"]["decision_status"]
          txn_id: number
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          category: Database["public"]["Enums"]["decision_category"]
          created_at?: string
          customer_message?: string | null
          decision_id?: never
          internal_notes?: string | null
          status?: Database["public"]["Enums"]["decision_status"]
          txn_id: number
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          category?: Database["public"]["Enums"]["decision_category"]
          created_at?: string
          customer_message?: string | null
          decision_id?: never
          internal_notes?: string | null
          status?: Database["public"]["Enums"]["decision_status"]
          txn_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_decisions_txn_id_fkey"
            columns: ["txn_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["txn_id"]
          },
        ]
      }
      transaction_feedback: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          category: Database["public"]["Enums"]["feedback_category"]
          comment: string | null
          created_at: string
          feedback_id: number
          investigator_id: number
          txn_id: number
          updated_at: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          category: Database["public"]["Enums"]["feedback_category"]
          comment?: string | null
          created_at?: string
          feedback_id?: never
          investigator_id: number
          txn_id: number
          updated_at?: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          category?: Database["public"]["Enums"]["feedback_category"]
          comment?: string | null
          created_at?: string
          feedback_id?: never
          investigator_id?: number
          txn_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_feedback_investigator_id_fkey"
            columns: ["investigator_id"]
            isOneToOne: false
            referencedRelation: "investigators"
            referencedColumns: ["investigator_id"]
          },
          {
            foreignKeyName: "transaction_feedback_investigator_id_fkey"
            columns: ["investigator_id"]
            isOneToOne: false
            referencedRelation: "v_case_assigned_investigator"
            referencedColumns: ["investigator_id"]
          },
          {
            foreignKeyName: "transaction_feedback_txn_id_fkey"
            columns: ["txn_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["txn_id"]
          },
        ]
      }
      transactions: {
        Row: {
          customer_id: number
          occurred_at: string
          recipient_account: string | null
          txn_amount: number
          txn_channel: Database["public"]["Enums"]["txn_channel"]
          txn_id: number
          txn_location: string | null
        }
        Insert: {
          customer_id: number
          occurred_at?: string
          recipient_account?: string | null
          txn_amount: number
          txn_channel?: Database["public"]["Enums"]["txn_channel"]
          txn_id?: never
          txn_location?: string | null
        }
        Update: {
          customer_id?: number
          occurred_at?: string
          recipient_account?: string | null
          txn_amount?: number
          txn_channel?: Database["public"]["Enums"]["txn_channel"]
          txn_id?: never
          txn_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          is_active: boolean
          is_locked: boolean
          locked_until: string | null
          password_hash: string | null
          phone: string | null
          role_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          is_active?: boolean
          is_locked?: boolean
          locked_until?: string | null
          password_hash?: string | null
          phone?: string | null
          role_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          is_active?: boolean
          is_locked?: boolean
          locked_until?: string | null
          password_hash?: string | null
          phone?: string | null
          role_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
    }
    Views: {
      customers_safe: {
        Row: {
          created_at: string | null
          customer_id: number | null
          home_location: string | null
          nid_number: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: number | null
          home_location?: string | null
          nid_number?: never
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: number | null
          home_location?: string | null
          nid_number?: never
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_case_assigned_investigator"
            referencedColumns: ["investigator_user_id"]
          },
        ]
      }
      kpi_case_success: {
        Row: {
          avg_close_hours: number | null
          closed_cases: number | null
          closure_rate: number | null
          open_cases: number | null
          total_cases: number | null
          under_investigation_cases: number | null
        }
        Relationships: []
      }
      users_safe: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          is_active: boolean | null
          is_locked: boolean | null
          locked_until: string | null
          phone: string | null
          role_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          is_active?: boolean | null
          is_locked?: boolean | null
          locked_until?: string | null
          phone?: string | null
          role_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          is_active?: boolean | null
          is_locked?: boolean | null
          locked_until?: string | null
          phone?: string | null
          role_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      v_case_assigned_investigator: {
        Row: {
          assigned_at: string | null
          badge_no: string | null
          case_id: number | null
          department: string | null
          investigator_email: string | null
          investigator_id: number | null
          investigator_name: string | null
          investigator_user_id: string | null
          note: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "fraud_cases"
            referencedColumns: ["case_id"]
          },
        ]
      }
      v_channel_suspicious_ranking: {
        Row: {
          avg_risk_score: number | null
          channel: Database["public"]["Enums"]["txn_channel"] | null
          suspicious_rate_pct: number | null
          suspicious_txn: number | null
          total_txn: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      app_ip: { Args: never; Returns: string }
      app_user_id: { Args: never; Returns: string }
      case_id_from_path: { Args: { p_path: string }; Returns: number }
      current_role_id: { Args: never; Returns: number }
      evaluate_transaction: { Args: { p_txn_id: number }; Returns: undefined }
      get_case_reporter: {
        Args: { p_case_id: number }
        Returns: {
          email: string
          full_name: string
          user_id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_auditor: { Args: never; Returns: boolean }
      is_customer: { Args: never; Returns: boolean }
      is_investigator: { Args: never; Returns: boolean }
      set_app_context: {
        Args: { p_ip: string; p_user_id: string }
        Returns: undefined
      }
      update_case_status: {
        Args: {
          p_case_id: number
          p_comment?: string
          p_new_status: Database["public"]["Enums"]["case_status"]
        }
        Returns: {
          message: string
          new_status: string
          old_status: string
          success: boolean
        }[]
      }
      user_can_access_case_messages: {
        Args: { p_case_id: number }
        Returns: boolean
      }
      user_is_assigned_investigator: {
        Args: { p_case_id: number }
        Returns: boolean
      }
      user_is_assigned_to_case_txn: {
        Args: { p_txn_id: number }
        Returns: boolean
      }
      user_is_case_owner: { Args: { p_case_id: number }; Returns: boolean }
      user_owns_customer: { Args: { p_customer_id: number }; Returns: boolean }
    }
    Enums: {
      approval_status: "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED"
      audit_action: "INSERT" | "UPDATE" | "DELETE"
      case_category:
        | "PAYMENT_FRAUD"
        | "IDENTITY_THEFT"
        | "ACCOUNT_TAKEOVER"
        | "SCAM"
        | "OTHER"
      case_status: "OPEN" | "UNDER_INVESTIGATION" | "CLOSED"
      decision_category:
        | "FRAUD_CONFIRMED"
        | "CLEARED"
        | "PARTIAL_FRAUD"
        | "INVESTIGATION_ONGOING"
        | "INSUFFICIENT_EVIDENCE"
        | "REFERRED_TO_AUTHORITIES"
      decision_status: "DRAFT" | "FINAL" | "COMMUNICATED"
      evidence_type: "SCREENSHOT" | "PDF" | "TRANSACTION_LOG" | "OTHER"
      feedback_category:
        | "CONFIRMED_FRAUD"
        | "FALSE_POSITIVE"
        | "REQUIRES_MORE_INFO"
        | "ESCALATE_TO_ADMIN"
        | "UNDER_REVIEW"
      risk_level: "LOW" | "MEDIUM" | "HIGH"
      severity_level: "LOW" | "MEDIUM" | "HIGH"
      txn_channel: "BKASH" | "NAGAD" | "CARD" | "BANK" | "CASH" | "OTHER"
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
      approval_status: ["PENDING", "APPROVED", "REJECTED", "ESCALATED"],
      audit_action: ["INSERT", "UPDATE", "DELETE"],
      case_category: [
        "PAYMENT_FRAUD",
        "IDENTITY_THEFT",
        "ACCOUNT_TAKEOVER",
        "SCAM",
        "OTHER",
      ],
      case_status: ["OPEN", "UNDER_INVESTIGATION", "CLOSED"],
      decision_category: [
        "FRAUD_CONFIRMED",
        "CLEARED",
        "PARTIAL_FRAUD",
        "INVESTIGATION_ONGOING",
        "INSUFFICIENT_EVIDENCE",
        "REFERRED_TO_AUTHORITIES",
      ],
      decision_status: ["DRAFT", "FINAL", "COMMUNICATED"],
      evidence_type: ["SCREENSHOT", "PDF", "TRANSACTION_LOG", "OTHER"],
      feedback_category: [
        "CONFIRMED_FRAUD",
        "FALSE_POSITIVE",
        "REQUIRES_MORE_INFO",
        "ESCALATE_TO_ADMIN",
        "UNDER_REVIEW",
      ],
      risk_level: ["LOW", "MEDIUM", "HIGH"],
      severity_level: ["LOW", "MEDIUM", "HIGH"],
      txn_channel: ["BKASH", "NAGAD", "CARD", "BANK", "CASH", "OTHER"],
    },
  },
} as const
