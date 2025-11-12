# 🎉 Stripe Subscription Setup for KYX

## ✅ What's Been Implemented

- **Pricing Page** (`/pricing`) with Free, Pro ($5/month), and Premium ($15/month) tiers
- **Checkout Flow** - Users can subscribe via Stripe Checkout
- **Customer Portal** - Users can manage subscriptions from Settings
- **Feature Gating** - Games per month limits and custom sprite uploads based on tier
- **Dashboard Integration** - Shows subscription status and usage
- **Webhook Handling** - Automatic subscription updates from Stripe

---

## 📋 Setup Checklist

### 1️⃣ Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add subscription columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'incomplete')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS games_created_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);

-- Function to reset monthly game count (run this monthly via cron or Edge Function)
CREATE OR REPLACE FUNCTION reset_monthly_game_counts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles
  SET games_created_this_month = 0,
      last_reset_date = CURRENT_DATE
  WHERE last_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$;
```

## Stripe Dashboard Setup

### 1. Create Products in Stripe

Go to Stripe Dashboard → Products → Create Product

**Pro Tier:**
- Name: `KYX Pro`
- Description: `20 games per month, custom sprites, priority builds`
- Price: `$5.00 USD / month`
- Recurring: Monthly
- Copy the Price ID (starts with `price_...`)

**Premium Tier:**
- Name: `KYX Premium`
- Description: `Unlimited games, custom sprites, fastest builds, early access`
- Price: `$15.00 USD / month`
- Recurring: Monthly
- Copy the Price ID (starts with `price_...`)

### 2. Get Your Stripe Keys

Stripe Dashboard → Developers → API keys

- **Publishable key** (starts with `pk_test_...` or `pk_live_...`)
- **Secret key** (starts with `sk_test_...` or `sk_live_...`)

### 3. Set Up Webhook

Stripe Dashboard → Developers → Webhooks → Add endpoint

- **Endpoint URL**: `https://kyx-engine.vercel.app/api/webhooks/stripe`
- **Events to send**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

After creating, copy the **Webhook signing secret** (starts with `whsec_...`)

## Environment Variables

Add these to your `.env.local` and Vercel:

```bash
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
```

## Subscription Tier Limits

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Games/month | 3 | 20 | Unlimited |
| AI Generation | Basic | Advanced | Best |
| Custom Sprites | ❌ | ✅ | ✅ |
| Private Games | ✅ | ✅ | ✅ |
| Build Priority | Standard | Priority | Fastest |

---

## 🧪 Testing

### Test Cards

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

**For all test cards:**
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### Test the Flow

1. **Create an account** on your local/staging environment
2. **Visit** `/pricing` page
3. **Click** "Upgrade to Pro" or "Upgrade to Premium"
4. **Use** a test card to complete checkout
5. **Check** the dashboard shows updated subscription
6. **Try** creating more than 3 games (should work with Pro/Premium)
7. **Try** uploading custom sprites (should work with Pro/Premium)
8. **Visit** `/settings` and click "Manage Subscription"
9. **Test** canceling/changing subscription in Customer Portal

---

## 🚀 Going Live

### Before Production:

1. **Switch to Live Mode** in Stripe Dashboard
2. **Create new products** in Live mode (repeat step 1)
3. **Get Live API keys** (replace `test` keys with `live` keys)
4. **Set up Live webhook** (repeat step 3 with production URL)
5. **Update environment variables** in Vercel with Live keys
6. **Test with real card** (use a card you're willing to be charged)

### Important Notes:

- Test mode and Live mode are completely separate in Stripe
- Customers, subscriptions, and products from Test mode won't carry over
- Always test the full flow in Test mode before going Live
- Set up proper error monitoring (Stripe Dashboard → Logs)

---

## 📊 Monitoring

### Stripe Dashboard

Monitor your subscriptions at: `https://dashboard.stripe.com/subscriptions`

### Key Metrics to Watch:

- **MRR (Monthly Recurring Revenue)** - Total subscription revenue
- **Churn Rate** - Percentage of cancellations
- **Failed Payments** - Cards that need attention
- **Webhook Events** - Ensure they're being delivered successfully

---

## 🛠️ Troubleshooting

### Webhook not working?

1. Check webhook secret matches `.env` variable
2. Verify webhook URL is accessible (not localhost for production)
3. Check Stripe Dashboard → Webhooks → Logs for errors

### Subscription not updating?

1. Check Supabase logs for webhook handler errors
2. Verify `stripe_customer_id` is saved in profiles table
3. Check Stripe event logs for delivery status

### Customer Portal not opening?

1. Ensure user has `stripe_customer_id` in their profile
2. Check API key has correct permissions
3. Verify return URL is whitelisted in Stripe settings

