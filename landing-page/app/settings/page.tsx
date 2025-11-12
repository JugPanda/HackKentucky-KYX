"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DashboardNav } from "@/components/dashboard-nav";
import { Loader2, Save, User, Mail, Lock, CreditCard, Sparkles, Zap, Crown } from "lucide-react";
import { getUserSubscription } from "@/lib/stripe/subscription-helpers";
import { TIER_INFO } from "@/lib/stripe/config";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Profile data
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  
  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Email change
  const [newEmail, setNewEmail] = useState("");
  
  // Subscription
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'premium'>('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('active');
  const [gamesCreated, setGamesCreated] = useState(0);
  const [gamesLimit, setGamesLimit] = useState(0);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);

  useEffect(() => {
    loadProfile();
    loadSubscription();
    handleEmailVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmailVerification = async () => {
    // Check if user just confirmed email change
    const params = new URLSearchParams(window.location.search);
    if (params.get('email-updated') === 'true') {
      const supabase = createClient();
      
      // Refresh the session multiple times to ensure we get the updated email
      await supabase.auth.refreshSession();
      
      // Wait a moment for the session to fully update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the fresh user data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        // Update the email state with the new email
        setEmail(user.email);
        setMessage({ type: "success", text: "Email updated successfully! Your new email is now active." });
      } else {
        setMessage({ type: "success", text: "Email updated! Please sign out and sign back in with your new email." });
      }
      
      // Clear the URL parameter
      window.history.replaceState({}, '', '/settings');
    }
  };

  const loadProfile = async () => {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    setEmail(user.email || "");
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    
    if (profile) {
      setUsername(profile.username || "");
    }
    
    setLoading(false);
  };

  const loadSubscription = async () => {
    const subscription = await getUserSubscription();
    if (subscription) {
      setSubscriptionTier(subscription.tier);
      setSubscriptionStatus(subscription.status);
      setGamesCreated(subscription.gamesCreatedThisMonth);
      setGamesLimit(subscription.gamesLimit);
      setPeriodEnd(subscription.currentPeriodEnd || null);
    }
  };

  const handleManageSubscription = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMessage({ type: "error", text: "Not authenticated" });
        return;
      }

      // Get Stripe customer portal URL
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { url, error } = await response.json();

      if (error) {
        setMessage({ type: "error", text: error });
        return;
      }

      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
      setMessage({ type: "error", text: "Failed to open subscription management" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage({ type: "error", text: "Not authenticated" });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Username updated successfully!" });
    }

    setSaving(false);
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    
    // Get the current domain (works for both dev and production)
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/settings?email-updated=true`
      : undefined;
    
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      redirectUrl ? { emailRedirectTo: redirectUrl } : undefined
    );

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Confirmation email sent to your new address! Check your inbox and click the link." });
      setNewEmail("");
    }

    setSaving(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords don't match!" });
      setSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password updated successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <>
        <DashboardNav />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile and account security</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === "success" 
              ? "bg-green-500/10 border border-green-500/30 text-green-300" 
              : "bg-red-500/10 border border-red-500/30 text-red-300"
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Username Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Username
              </CardTitle>
              <CardDescription>
                Your public username displayed on your games
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateUsername} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    minLength={3}
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    3-50 characters, letters, numbers, hyphens and underscores only
                  </p>
                </div>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Username
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border">
                <div className="flex items-center gap-3">
                  {subscriptionTier === 'free' && <Sparkles className="w-6 h-6 text-blue-400" />}
                  {subscriptionTier === 'pro' && <Zap className="w-6 h-6 text-purple-400" />}
                  {subscriptionTier === 'premium' && <Crown className="w-6 h-6 text-yellow-400" />}
                  <div>
                    <p className="font-semibold text-lg capitalize">{TIER_INFO[subscriptionTier].name} Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {gamesLimit === -1 
                        ? `${gamesCreated} games created this month (unlimited)` 
                        : `${gamesCreated} / ${gamesLimit} games this month`}
                    </p>
                    {periodEnd && subscriptionTier !== 'free' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Renews on {periodEnd.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-2xl">${TIER_INFO[subscriptionTier].price}</p>
                  {subscriptionTier !== 'free' && <p className="text-xs text-muted-foreground">per month</p>}
                </div>
              </div>

              <div className="flex gap-3">
                {subscriptionTier === 'free' ? (
                  <Button 
                    onClick={() => router.push('/pricing')}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Upgrade to Pro
                  </Button>
                ) : (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={saving}
                    variant="outline"
                    className="flex-1"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Manage Subscription
                  </Button>
                )}
                <Button
                  onClick={() => router.push('/pricing')}
                  variant="outline"
                >
                  View All Plans
                </Button>
              </div>

              {subscriptionStatus === 'past_due' && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  Your payment failed. Please update your payment method to continue using premium features.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Address
              </CardTitle>
              <CardDescription>
                Current: {email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div>
                  <Label htmlFor="new-email">New Email Address</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You&apos;ll need to verify your new email address
                  </p>
                </div>
                <Button type="submit" disabled={saving || !newEmail} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Update Email
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={saving || !newPassword || !confirmPassword} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

