// Database types for TypeScript
export type GameStatus = "draft" | "building" | "built" | "published" | "failed";
export type GameVisibility = "private" | "unlisted" | "public";
export type BuildQueueStatus = "pending" | "processing" | "completed" | "failed";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export type SubscriptionTier = 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete';

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_current_period_end?: string;
  games_created_this_month: number;
  last_reset_date: string;
}

export interface Game {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description?: string;
  config: Record<string, unknown>; // Game configuration JSON
  status: GameStatus;
  visibility: GameVisibility;
  bundle_url?: string;
  bundle_size?: number;
  play_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  
  // Joined relations (optional)
  profiles?: Profile;
}

export interface BuildQueue {
  id: string;
  game_id: string;
  user_id: string;
  status: BuildQueueStatus;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  game_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  game_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  
  // Joined relations (optional)
  profiles?: Profile;
}

export interface Report {
  id: string;
  reporter_id?: string;
  reported_user_id?: string;
  game_id?: string;
  comment_id?: string;
  reason: string;
  status: ReportStatus;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

