import { SubscriptionTier } from "./db-types";

export interface TierLimits {
  name: string;
  price: number;
  gamesPerMonth: number;
  customSprites: boolean;
  buildPriority: 'standard' | 'priority' | 'fastest';
  features: string[];
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    name: "Free",
    price: 0,
    gamesPerMonth: 3,
    customSprites: false,
    buildPriority: 'standard',
    features: [
      "3 games per month",
      "Basic AI generation",
      "Private games",
      "Standard build queue",
    ],
  },
  pro: {
    name: "Pro",
    price: 5,
    gamesPerMonth: 20,
    customSprites: true,
    buildPriority: 'priority',
    features: [
      "20 games per month",
      "Advanced AI generation",
      "Custom sprite uploads",
      "Private games",
      "Priority build queue",
    ],
  },
  premium: {
    name: "Premium",
    price: 15,
    gamesPerMonth: Infinity,
    customSprites: true,
    buildPriority: 'fastest',
    features: [
      "Unlimited games",
      "Best AI generation",
      "Custom sprite uploads",
      "Private games",
      "Fastest build queue",
      "Early access to new features",
    ],
  },
};

export function canCreateGame(tier: SubscriptionTier, gamesCreatedThisMonth: number): boolean {
  const limit = SUBSCRIPTION_LIMITS[tier];
  return gamesCreatedThisMonth < limit.gamesPerMonth;
}

export function canUseCustomSprites(tier: SubscriptionTier): boolean {
  return SUBSCRIPTION_LIMITS[tier].customSprites;
}

export function getBuildPriority(tier: SubscriptionTier): number {
  const priorities = { fastest: 1, priority: 2, standard: 3 };
  return priorities[SUBSCRIPTION_LIMITS[tier].buildPriority];
}

