// Supabase-generated types — manually defined to match our schema.
// Replace with `supabase gen types typescript` output once connected.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          role: "super_admin" | "admin" | "finance" | "agent";
          team_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "super_admin" | "admin" | "finance" | "agent";
          team_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "super_admin" | "admin" | "finance" | "agent";
          team_id?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      owners: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          nationality: string | null;
          property_type: string | null;
          area: string | null;
          community: string | null;
          building_name: string | null;
          unit_number: string | null;
          bedrooms: number | null;
          bathrooms: number | null;
          size_sqft: number | null;
          asking_price: number | null;
          currency: string;
          purpose: string | null;
          notes: string | null;
          source: string | null;
          assigned_agent_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          nationality?: string | null;
          property_type?: string | null;
          area?: string | null;
          community?: string | null;
          building_name?: string | null;
          unit_number?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          size_sqft?: number | null;
          asking_price?: number | null;
          currency?: string;
          purpose?: string | null;
          notes?: string | null;
          source?: string | null;
          assigned_agent_id?: string | null;
          created_by: string;
        };
        Update: {
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          nationality?: string | null;
          property_type?: string | null;
          area?: string | null;
          community?: string | null;
          building_name?: string | null;
          unit_number?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          size_sqft?: number | null;
          asking_price?: number | null;
          purpose?: string | null;
          notes?: string | null;
          source?: string | null;
          assigned_agent_id?: string | null;
        };
      };
      listings: {
        Row: {
          id: string;
          reference_no: string;
          title: string;
          description: string | null;
          type: "sale" | "rent";
          property_type: string;
          area: string;
          community: string | null;
          building_name: string | null;
          unit_number: string | null;
          latitude: number | null;
          longitude: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          size_sqft: number | null;
          plot_size_sqft: number | null;
          furnished: string | null;
          parking_spaces: number;
          amenities: Json;
          price: number;
          currency: string;
          price_per_sqft: number | null;
          rent_frequency: string | null;
          permit_number: string | null;
          ded_license: string | null;
          status: string;
          is_published: boolean;
          publish_portals: Json;
          watermark_enabled: boolean;
          owner_id: string | null;
          assigned_agent_id: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_no?: string;
          title: string;
          description?: string | null;
          type: "sale" | "rent";
          property_type: string;
          area: string;
          community?: string | null;
          building_name?: string | null;
          unit_number?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          size_sqft?: number | null;
          plot_size_sqft?: number | null;
          furnished?: string | null;
          parking_spaces?: number;
          amenities?: Json;
          price: number;
          currency?: string;
          price_per_sqft?: number | null;
          rent_frequency?: string | null;
          permit_number?: string | null;
          ded_license?: string | null;
          status?: string;
          is_published?: boolean;
          publish_portals?: Json;
          watermark_enabled?: boolean;
          owner_id?: string | null;
          assigned_agent_id: string;
          created_by: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          type?: "sale" | "rent";
          property_type?: string;
          area?: string;
          community?: string | null;
          building_name?: string | null;
          unit_number?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          size_sqft?: number | null;
          plot_size_sqft?: number | null;
          furnished?: string | null;
          parking_spaces?: number;
          amenities?: Json;
          price?: number;
          price_per_sqft?: number | null;
          rent_frequency?: string | null;
          permit_number?: string | null;
          ded_license?: string | null;
          status?: string;
          is_published?: boolean;
          publish_portals?: Json;
          watermark_enabled?: boolean;
          owner_id?: string | null;
          assigned_agent_id?: string;
        };
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          storage_path: string;
          url: string;
          display_order: number;
          is_primary: boolean;
          is_watermarked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          storage_path: string;
          url: string;
          display_order?: number;
          is_primary?: boolean;
          is_watermarked?: boolean;
        };
        Update: {
          storage_path?: string;
          url?: string;
          display_order?: number;
          is_primary?: boolean;
          is_watermarked?: boolean;
        };
      };
      leads: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          nationality: string | null;
          source: string | null;
          budget_min: number | null;
          budget_max: number | null;
          preferred_areas: Json;
          property_type: string | null;
          purpose: string | null;
          bedrooms_min: number | null;
          bedrooms_max: number | null;
          status: string;
          priority: string;
          assigned_agent_id: string | null;
          listing_id: string | null;
          notes: string | null;
          last_contacted_at: string | null;
          next_follow_up: string | null;
          lost_reason: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          nationality?: string | null;
          source?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          preferred_areas?: Json;
          property_type?: string | null;
          purpose?: string | null;
          bedrooms_min?: number | null;
          bedrooms_max?: number | null;
          status?: string;
          priority?: string;
          assigned_agent_id?: string | null;
          listing_id?: string | null;
          notes?: string | null;
          last_contacted_at?: string | null;
          next_follow_up?: string | null;
          lost_reason?: string | null;
          created_by: string;
        };
        Update: {
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          nationality?: string | null;
          source?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          preferred_areas?: Json;
          property_type?: string | null;
          purpose?: string | null;
          bedrooms_min?: number | null;
          bedrooms_max?: number | null;
          status?: string;
          priority?: string;
          assigned_agent_id?: string | null;
          listing_id?: string | null;
          notes?: string | null;
          last_contacted_at?: string | null;
          next_follow_up?: string | null;
          lost_reason?: string | null;
        };
      };
      contacts: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          designation: string | null;
          nationality: string | null;
          area_tags: Json;
          source: string | null;
          notes: string | null;
          assigned_agent_id: string | null;
          upload_batch_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          designation?: string | null;
          nationality?: string | null;
          area_tags?: Json;
          source?: string | null;
          notes?: string | null;
          assigned_agent_id?: string | null;
          upload_batch_id?: string | null;
          created_by: string;
        };
        Update: {
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          designation?: string | null;
          nationality?: string | null;
          area_tags?: Json;
          source?: string | null;
          notes?: string | null;
          assigned_agent_id?: string | null;
        };
      };
      upload_batches: {
        Row: {
          id: string;
          file_name: string;
          total_records: number;
          processed_records: number;
          failed_records: number;
          status: string;
          error_log: Json;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_name: string;
          total_records?: number;
          processed_records?: number;
          failed_records?: number;
          status?: string;
          error_log?: Json;
          uploaded_by: string;
        };
        Update: {
          total_records?: number;
          processed_records?: number;
          failed_records?: number;
          status?: string;
          error_log?: Json;
        };
      };
      transactions: {
        Row: {
          id: string;
          reference_no: string;
          type: "sale" | "rent";
          listing_id: string | null;
          lead_id: string | null;
          agent_id: string;
          deal_value: number;
          currency: string;
          commission_pct: number | null;
          commission_amount: number;
          company_share: number | null;
          agent_share: number | null;
          deal_date: string;
          closing_date: string | null;
          status: string;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_no?: string;
          type: "sale" | "rent";
          listing_id?: string | null;
          lead_id?: string | null;
          agent_id: string;
          deal_value: number;
          currency?: string;
          commission_pct?: number | null;
          commission_amount: number;
          company_share?: number | null;
          agent_share?: number | null;
          deal_date: string;
          closing_date?: string | null;
          status?: string;
          notes?: string | null;
          created_by: string;
        };
        Update: {
          type?: "sale" | "rent";
          listing_id?: string | null;
          lead_id?: string | null;
          agent_id?: string;
          deal_value?: number;
          commission_pct?: number | null;
          commission_amount?: number;
          company_share?: number | null;
          agent_share?: number | null;
          deal_date?: string;
          closing_date?: string | null;
          status?: string;
          notes?: string | null;
        };
      };
      commission_approvals: {
        Row: {
          id: string;
          transaction_id: string;
          agent_id: string;
          commission_amount: number;
          status: string;
          owner_approved_at: string | null;
          owner_approved_by: string | null;
          owner_notes: string | null;
          finance_cleared_at: string | null;
          finance_cleared_by: string | null;
          finance_notes: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          agent_id: string;
          commission_amount: number;
          status?: string;
        };
        Update: {
          commission_amount?: number;
          status?: string;
          owner_approved_at?: string | null;
          owner_approved_by?: string | null;
          owner_notes?: string | null;
          finance_cleared_at?: string | null;
          finance_cleared_by?: string | null;
          finance_notes?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: never;
      };
      settings: {
        Row: {
          id: string;
          category: string;
          key: string;
          value: Json;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          key: string;
          value: Json;
          updated_by?: string | null;
        };
        Update: {
          value?: Json;
          updated_by?: string | null;
        };
      };
    };
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_admin_or_above: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type Owner = Database["public"]["Tables"]["owners"]["Row"];
export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type CommissionApproval = Database["public"]["Tables"]["commission_approvals"]["Row"];
export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type Setting = Database["public"]["Tables"]["settings"]["Row"];
export type ListingImage = Database["public"]["Tables"]["listing_images"]["Row"];
export type UploadBatch = Database["public"]["Tables"]["upload_batches"]["Row"];
