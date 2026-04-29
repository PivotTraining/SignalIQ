export type Plan = 'starter' | 'pro' | 'agency';
export type SignalStrength = 'hot' | 'warm' | 'trigger';
export type ProspectStage = 'new' | 'contacted' | 'meeting' | 'proposal' | 'closed';
export type ProspectPriority = 'high' | 'medium' | 'low' | null;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          business_name: string;
          offer_text: string;
          plan: Plan;
          gen_count: number;
          hunter_api_key: string | null;
          pdl_api_key: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          business_name?: string;
          offer_text?: string;
          plan?: Plan;
          gen_count?: number;
          hunter_api_key?: string | null;
          pdl_api_key?: string | null;
          stripe_customer_id?: string | null;
        };
        Update: {
          full_name?: string;
          business_name?: string;
          offer_text?: string;
          plan?: Plan;
          gen_count?: number;
          hunter_api_key?: string | null;
          pdl_api_key?: string | null;
          stripe_customer_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      target_industries: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      target_titles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      prospects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          company: string;
          title: string | null;
          email: string | null;
          phone: string | null;
          linkedin_url: string | null;
          industry: string | null;
          location: string | null;
          signal_text: string | null;
          signal_strength: SignalStrength;
          stage: ProspectStage;
          brief: string | null;
          emails: string | null;
          script: string | null;
          notes: string | null;
          priority: ProspectPriority;
          last_contacted: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          company: string;
          title?: string | null;
          email?: string | null;
          phone?: string | null;
          linkedin_url?: string | null;
          industry?: string | null;
          location?: string | null;
          signal_text?: string | null;
          signal_strength?: SignalStrength;
          stage?: ProspectStage;
          brief?: string | null;
          emails?: string | null;
          script?: string | null;
          notes?: string | null;
          priority?: ProspectPriority;
          last_contacted?: string | null;
        };
        Update: {
          name?: string;
          company?: string;
          title?: string | null;
          email?: string | null;
          phone?: string | null;
          linkedin_url?: string | null;
          industry?: string | null;
          location?: string | null;
          signal_text?: string | null;
          signal_strength?: SignalStrength;
          stage?: ProspectStage;
          brief?: string | null;
          emails?: string | null;
          script?: string | null;
          notes?: string | null;
          priority?: ProspectPriority;
          last_contacted?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      signals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          snippet: string | null;
          source_url: string;
          signal_type: SignalStrength;
          score: number;
          dismissed: boolean;
          converted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          snippet?: string | null;
          source_url: string;
          signal_type?: SignalStrength;
          score?: number;
          dismissed?: boolean;
          converted?: boolean;
        };
        Update: {
          title?: string;
          snippet?: string | null;
          source_url?: string;
          signal_type?: SignalStrength;
          score?: number;
          dismissed?: boolean;
          converted?: boolean;
        };
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          detail: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          detail?: string | null;
        };
        Update: {
          action?: string;
          detail?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Prospect = Database['public']['Tables']['prospects']['Row'];
export type ProspectInsert = Database['public']['Tables']['prospects']['Insert'];
export type ProspectUpdate = Database['public']['Tables']['prospects']['Update'];

export type Signal = Database['public']['Tables']['signals']['Row'];
export type SignalInsert = Database['public']['Tables']['signals']['Insert'];

export type ActivityLog = Database['public']['Tables']['activity_log']['Row'];

export interface ProspectContext {
  name: string;
  company: string;
  title?: string;
  industry?: string;
  signal_text?: string;
}
