import { createClient } from "@/lib/supabase/client";
import { SUBSCRIPTION_LIMITS } from "@/lib/subscription-limits";
import type { SubscriptionTier } from "@/lib/db-types";

export interface UserSubscription {
  tier: SubscriptionTier;
  status: string;
  gamesCreatedThisMonth: number;
  gamesLimit: number;
  currentPeriodEnd: Date | null;
}

export async function getUserSubscription(): Promise<UserSubscription | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, games_created_this_month, subscription_current_period_end")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  const tier = profile.subscription_tier as SubscriptionTier;
  const limits = SUBSCRIPTION_LIMITS[tier];

  return {
    tier,
    status: profile.subscription_status || "active",
    gamesCreatedThisMonth: profile.games_created_this_month || 0,
    gamesLimit: limits.gamesPerMonth === Infinity ? -1 : limits.gamesPerMonth,
    currentPeriodEnd: profile.subscription_current_period_end 
      ? new Date(profile.subscription_current_period_end) 
      : null,
  };
}
