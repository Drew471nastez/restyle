export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Enums ──────────────────────────────────────────────────────────
export type UserStatus = 'onboarding' | 'active' | 'suspended' | 'banned' | 'deactivated' | 'deleted';
export type SellerStatus = 'not_ready' | 'pending_verification' | 'ready' | 'blocked';
export type OnboardingStep = 'profile' | 'location' | 'preferences' | 'complete';

// ── Tables ─────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          country: string;
          city: string | null;
          phone: string | null;
          is_verified: boolean;
          is_pro: boolean;
          is_admin: boolean;
          status: UserStatus;
          seller_status: SellerStatus;
          onboarding_step: OnboardingStep;
          onboarding_completed_at: string | null;
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean;
          rating_avg: number;
          rating_count: number;
          listings_count: number;
          sold_count: number;
          response_rate: number;
          response_time_hours: number | null;
          last_active_at: string | null;
          holiday_mode: boolean;
          accepted_seller_terms_at: string | null;
          accepted_buyer_terms_at: string | null;
          username_changed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          country?: string;
          city?: string | null;
          phone?: string | null;
          is_verified?: boolean;
          is_pro?: boolean;
          is_admin?: boolean;
          status?: UserStatus;
          seller_status?: SellerStatus;
          onboarding_step?: OnboardingStep;
          onboarding_completed_at?: string | null;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          rating_avg?: number;
          rating_count?: number;
          listings_count?: number;
          sold_count?: number;
          response_rate?: number;
          response_time_hours?: number | null;
          last_active_at?: string | null;
          holiday_mode?: boolean;
          accepted_seller_terms_at?: string | null;
          accepted_buyer_terms_at?: string | null;
          username_changed_at?: string | null;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          country?: string;
          city?: string | null;
          phone?: string | null;
          is_verified?: boolean;
          is_pro?: boolean;
          is_admin?: boolean;
          status?: UserStatus;
          seller_status?: SellerStatus;
          onboarding_step?: OnboardingStep;
          onboarding_completed_at?: string | null;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          rating_avg?: number;
          rating_count?: number;
          listings_count?: number;
          sold_count?: number;
          response_rate?: number;
          response_time_hours?: number | null;
          last_active_at?: string | null;
          holiday_mode?: boolean;
          accepted_seller_terms_at?: string | null;
          accepted_buyer_terms_at?: string | null;
          username_changed_at?: string | null;
          updated_at?: string;
        };
      };
      user_private_details: {
        Row: {
          user_id: string;
          legal_first_name: string | null;
          legal_last_name: string | null;
          date_of_birth: string | null;
          tax_id: string | null;
          id_verification_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          legal_first_name?: string | null;
          legal_last_name?: string | null;
          date_of_birth?: string | null;
          tax_id?: string | null;
          id_verification_status?: string;
        };
        Update: {
          legal_first_name?: string | null;
          legal_last_name?: string | null;
          date_of_birth?: string | null;
          tax_id?: string | null;
          id_verification_status?: string;
          updated_at?: string;
        };
      };
      shipping_addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          full_name: string;
          street_line_1: string;
          street_line_2: string | null;
          city: string;
          state_province: string | null;
          postal_code: string;
          country: string;
          phone: string | null;
          is_default: boolean;
          is_return_address: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string;
          full_name: string;
          street_line_1: string;
          street_line_2?: string | null;
          city: string;
          state_province?: string | null;
          postal_code: string;
          country: string;
          phone?: string | null;
          is_default?: boolean;
          is_return_address?: boolean;
        };
        Update: {
          label?: string;
          full_name?: string;
          street_line_1?: string;
          street_line_2?: string | null;
          city?: string;
          state_province?: string | null;
          postal_code?: string;
          country?: string;
          phone?: string | null;
          is_default?: boolean;
          is_return_address?: boolean;
          updated_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          user_id: string;
          email_messages: boolean;
          email_orders: boolean;
          email_offers: boolean;
          email_price_drops: boolean;
          email_marketing: boolean;
          email_security: boolean;
          push_messages: boolean;
          push_orders: boolean;
          push_offers: boolean;
          push_marketing: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email_messages?: boolean;
          email_orders?: boolean;
          email_offers?: boolean;
          email_price_drops?: boolean;
          email_marketing?: boolean;
          email_security?: boolean;
          push_messages?: boolean;
          push_orders?: boolean;
          push_offers?: boolean;
          push_marketing?: boolean;
        };
        Update: {
          email_messages?: boolean;
          email_orders?: boolean;
          email_offers?: boolean;
          email_price_drops?: boolean;
          email_marketing?: boolean;
          email_security?: boolean;
          push_messages?: boolean;
          push_orders?: boolean;
          push_offers?: boolean;
          push_marketing?: boolean;
          updated_at?: string;
        };
      };
      privacy_settings: {
        Row: {
          user_id: string;
          show_city: boolean;
          show_online_status: boolean;
          show_last_active: boolean;
          allow_search_engines: boolean;
          allow_messages_from: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          show_city?: boolean;
          show_online_status?: boolean;
          show_last_active?: boolean;
          allow_search_engines?: boolean;
          allow_messages_from?: string;
        };
        Update: {
          show_city?: boolean;
          show_online_status?: boolean;
          show_last_active?: boolean;
          allow_search_engines?: boolean;
          allow_messages_from?: string;
          updated_at?: string;
        };
      };
      seller_preferences: {
        Row: {
          user_id: string;
          bundle_discount_enabled: boolean;
          bundle_discount_percent: number;
          bundle_min_items: number;
          auto_accept_full_price: boolean;
          shipping_turnaround_days: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          bundle_discount_enabled?: boolean;
          bundle_discount_percent?: number;
          bundle_min_items?: number;
          auto_accept_full_price?: boolean;
          shipping_turnaround_days?: number;
        };
        Update: {
          bundle_discount_enabled?: boolean;
          bundle_discount_percent?: number;
          bundle_min_items?: number;
          auto_accept_full_price?: boolean;
          shipping_turnaround_days?: number;
          updated_at?: string;
        };
      };
      blocked_users: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          reason?: string | null;
        };
        Update: never;
      };
      user_reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          description: string | null;
          status: string;
          admin_notes: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          description?: string | null;
          status?: string;
          admin_notes?: string | null;
        };
        Update: {
          status?: string;
          admin_notes?: string | null;
          resolved_at?: string | null;
        };
      };
      reserved_usernames: {
        Row: {
          username: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          username: string;
          reason?: string | null;
        };
        Update: never;
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string | null;
          brand: string | null;
          size: string;
          condition: string;
          category: string;
          subcategory: string | null;
          price: number;
          currency: string;
          images: string[];
          status: string;
          is_boosted: boolean;
          is_featured: boolean;
          boost_expires_at: string | null;
          country: string;
          views_count: number;
          favorites_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          description?: string | null;
          brand?: string | null;
          size: string;
          condition: string;
          category: string;
          subcategory?: string | null;
          price: number;
          currency?: string;
          images: string[];
          status?: string;
          is_boosted?: boolean;
          is_featured?: boolean;
          boost_expires_at?: string | null;
          country?: string;
          views_count?: number;
          favorites_count?: number;
        };
        Update: {
          seller_id?: string;
          title?: string;
          description?: string | null;
          brand?: string | null;
          size?: string;
          condition?: string;
          category?: string;
          subcategory?: string | null;
          price?: number;
          currency?: string;
          images?: string[];
          status?: string;
          is_boosted?: boolean;
          is_featured?: boolean;
          boost_expires_at?: string | null;
          country?: string;
          views_count?: number;
          favorites_count?: number;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          buyer_id: string;
          seller_id: string;
          listing_id: string;
          status: string;
          total_amount: number;
          item_price: number;
          shipping_cost: number;
          platform_fee: number;
          currency: string;
          stripe_payment_intent_id: string | null;
          shipping_label_url: string | null;
          tracking_number: string | null;
          shipping_provider: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          completed_at: string | null;
          dispute_reason: string | null;
          shipping_address_snapshot: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          seller_id: string;
          listing_id: string;
          status?: string;
          total_amount: number;
          item_price: number;
          shipping_cost: number;
          platform_fee: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          shipping_label_url?: string | null;
          tracking_number?: string | null;
          shipping_provider?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          completed_at?: string | null;
          dispute_reason?: string | null;
          shipping_address_snapshot?: Json | null;
        };
        Update: {
          status?: string;
          stripe_payment_intent_id?: string | null;
          shipping_label_url?: string | null;
          tracking_number?: string | null;
          shipping_provider?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          completed_at?: string | null;
          dispute_reason?: string | null;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          listing_id: string;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          listing_id: string;
          price: number;
        };
        Update: {
          price?: number;
        };
      };
      conversations: {
        Row: {
          id: string;
          participant_1: string;
          participant_2: string;
          listing_id: string | null;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_1: string;
          participant_2: string;
          listing_id?: string | null;
          last_message_at?: string;
        };
        Update: {
          last_message_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: string;
          offer_amount: number | null;
          offer_status: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type?: string;
          offer_amount?: number | null;
          offer_status?: string | null;
          is_read?: boolean;
        };
        Update: {
          content?: string;
          offer_status?: string | null;
          is_read?: boolean;
        };
      };
      reviews: {
        Row: {
          id: string;
          order_id: string;
          reviewer_id: string;
          reviewed_id: string;
          rating: number;
          comment: string | null;
          review_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          reviewer_id: string;
          reviewed_id: string;
          rating: number;
          comment?: string | null;
          review_type?: string | null;
        };
        Update: {
          rating?: number;
          comment?: string | null;
        };
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          available_balance: number;
          pending_balance: number;
          total_earned: number;
          currency: string;
          iban: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          available_balance?: number;
          pending_balance?: number;
          total_earned?: number;
          currency?: string;
          iban?: string | null;
        };
        Update: {
          available_balance?: number;
          pending_balance?: number;
          total_earned?: number;
          iban?: string | null;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          wallet_id: string;
          order_id: string | null;
          type: string;
          amount: number;
          status: string;
          stripe_transfer_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_id: string;
          order_id?: string | null;
          type: string;
          amount: number;
          status?: string;
          stripe_transfer_id?: string | null;
          description?: string | null;
        };
        Update: {
          status?: string;
          stripe_transfer_id?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          plan: string;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          plan?: string;
          status: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
        };
        Update: {
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          listing_id: string;
        };
        Update: never;
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// ── Convenience types ──────────────────────────────────────────────
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type UserPrivateDetails = Database['public']['Tables']['user_private_details']['Row'];
export type ShippingAddress = Database['public']['Tables']['shipping_addresses']['Row'];
export type NotificationPreferences = Database['public']['Tables']['notification_preferences']['Row'];
export type PrivacySettings = Database['public']['Tables']['privacy_settings']['Row'];
export type SellerPreferences = Database['public']['Tables']['seller_preferences']['Row'];
export type Listing = Database['public']['Tables']['listings']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type Wallet = Database['public']['Tables']['wallets']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type BlockedUser = Database['public']['Tables']['blocked_users']['Row'];
export type UserReport = Database['public']['Tables']['user_reports']['Row'];

// ── Seller eligibility ─────────────────────────────────────────────
export interface SellerEligibility {
  canSell: boolean;
  missing: string[];
}

export interface BuyerEligibility {
  canBuy: boolean;
  missing: string[];
}
