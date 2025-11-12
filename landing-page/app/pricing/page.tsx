"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles, Zap, Rocket } from "lucide-react";
import { SUBSCRIPTION_LIMITS } from "@/lib/subscription-limits";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SubscriptionTier } from "@/lib/db-types";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>("free");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setIsAuthenticated(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setCurrentTier(profile.subscription_tier);
      }
    }
    
    setLoading(false);
  };

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!isAuthenticated) {
      router.push("/auth/sign-in?redirect=/pricing");
      return;
    }

    if (tier === "free") {
      return; // Can't subscribe to free tier
    }

    setSubscribing(tier);

    try {
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const { url, error } = await response.json();

      if (error) {
        alert(error);
        setSubscribing(null);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Failed to start subscription. Please try again.");
      setSubscribing(null);
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case "free":
        return <Sparkles className="w-8 h-8" />;
      case "pro":
        return <Zap className="w-8 h-8" />;
      case "premium":
        return <Rocket className="w-8 h-8" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case "free":
        return "border-gray-500";
      case "pro":
        return "border-blue-500";
      case "premium":
        return "border-purple-500";
    }
  };

  // Public navigation for non-authenticated users
  const PublicNav = () => (
    <header className="border-b border-slate-800/80 bg-slate-950/40 sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <>
        {isAuthenticated ? <DashboardNav /> : <PublicNav />}
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </>
    );
  }

  return (
    <>
      {isAuthenticated ? <DashboardNav /> : <PublicNav />}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Create amazing games with KYX. Upgrade anytime to unlock more features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {(Object.keys(SUBSCRIPTION_LIMITS) as SubscriptionTier[]).map((tier) => {
            const limits = SUBSCRIPTION_LIMITS[tier];
            const isCurrentTier = tier === currentTier;
            const isUpgrade = tier !== "free" && (
              (currentTier === "free") ||
              (currentTier === "pro" && tier === "premium")
            );

            return (
              <Card
                key={tier}
                className={`relative ${getTierColor(tier)} ${
                  isCurrentTier ? "ring-2 ring-offset-2 ring-offset-background" : ""
                } ${tier === "premium" ? "md:scale-105" : ""}`}
              >
                {tier === "premium" && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="flex justify-center mb-4">
                    {getTierIcon(tier)}
                  </div>
                  <CardTitle className="text-3xl">{limits.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">
                      ${limits.price}
                    </span>
                    {limits.price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  {isCurrentTier && (
                    <div className="mt-4 text-sm font-semibold text-green-500">
                      Current Plan
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {limits.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(tier)}
                    disabled={
                      isCurrentTier ||
                      subscribing !== null ||
                      tier === "free"
                    }
                    className="w-full"
                    variant={isUpgrade ? "default" : "outline"}
                  >
                    {subscribing === tier ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentTier ? (
                      "Current Plan"
                    ) : tier === "free" ? (
                      "Free Forever"
                    ) : isUpgrade ? (
                      "Upgrade Now"
                    ) : (
                      "Downgrade"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>All plans include access to the KYX game creation platform.</p>
          <p className="mt-2">Cancel or change your plan anytime from your account settings.</p>
        </div>
      </div>
    </>
  );
}
