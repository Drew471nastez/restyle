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
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean;
          rating_avg: number;
          rating_count: number;
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
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          rating_avg?: number;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
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
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          rating_avg?: number;
          rating_count?: number;
          updated_at?: string;
        };
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
          created_at?: string;
          updated_at?: string;
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

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Listing = Database['public']['Tables']['listings']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type Wallet = Database['public']['Tables']['wallets']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
