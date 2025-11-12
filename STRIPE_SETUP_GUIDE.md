# Stripe Subscription Setup Guide for KYX

Great news! Your Stripe subscription system is fully implemented! 🎉

This guide will walk you through the final configuration steps to get subscriptions live on production.

---

## ✅ What's Already Implemented

- ✅ **3 Subscription Tiers**: Free, Pro ($5/month), Premium ($15/month)
- ✅ **Pricing Page**: Beautiful tier cards at `/pricing`
- ✅ **Stripe Checkout**: Create subscription sessions
- ✅ **Stripe Webhooks**: Handle subscription events (created, updated, canceled, payments)
- ✅ **Feature Gating**: Enforce game limits and custom sprite access
- ✅ **Dashboard**: Show subscription status and upgrade button
- ✅ **Settings Page**: Manage subscription via Stripe Customer Portal
- ✅ **Database Migration**: SQL file ready to run

---

## 📋 Setup Checklist

### Step 1: Run Database Migration

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: SQL Editor (left sidebar)
3. **Open the migration file**: `supabase-migration-subscriptions.sql`
4. **Copy all the SQL** and paste it into the Supabase SQL Editor
5. **Click "Run"**

This will add the following fields to your `profiles` table:
- `subscription_tier` (free/pro/premium)
- `subscription_status` (active/canceled/past_due/incomplete)
- `stripe_customer_id`
- `stripe_subscription_id`
- `subscription_current_period_end`
- `games_created_this_month`
- `last_reset_date`

---

### Step 2: Create Stripe Products & Prices

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Click "Products"** in the left sidebar
3. **Create Pro Product**:
   - Click **"Add product"**
   - Name: `KYX Pro`
   - Description: `20 games per month, custom sprites, priority builds`
   - **Pricing**:
     - Model: `Recurring`
     - Price: `$5.00 USD`
     - Billing period: `Monthly`
   - Click **"Save product"**
   - **Copy the Price ID** (starts with `price_...`) - you'll need this!

4. **Create Premium Product**:
   - Click **"Add product"**
   - Name: `KYX Premium`
   - Description: `Unlimited games, custom sprites, fastest builds, early access`
   - **Pricing**:
     - Model: `Recurring`
     - Price: `$15.00 USD`
     - Billing period: `Monthly`
   - Click **"Save product"**
   - **Copy the Price ID** (starts with `price_...`) - you'll need this!

---

### Step 3: Configure Environment Variables

You need to add these Stripe environment variables to your deployment:

#### **Vercel Environment Variables**:

Go to: https://vercel.com/your-project/settings/environment-variables

Add the following:

```bash
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_...       # Use sk_test_... for testing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Use pk_test_... for testing

# Get these from Step 2 above (Price IDs from your products)
STRIPE_PRO_PRICE_ID=price_...       # Pro plan price ID
STRIPE_PREMIUM_PRICE_ID=price_...   # Premium plan price ID

# Get this from: https://dashboard.stripe.com/webhooks (see Step 4)
STRIPE_WEBHOOK_SECRET=whsec_...

# Your production site URL
NEXT_PUBLIC_SITE_URL=https://kyx-engine.vercel.app
```

**Important**: 
- Use **Test Mode** keys for testing (starts with `sk_test_` and `pk_test_`)
- Use **Live Mode** keys for production (starts with `sk_live_` and `pk_live_`)
- You can toggle between Test/Live mode in the top-right of Stripe Dashboard

---

### Step 4: Set Up Stripe Webhooks

Webhooks allow Stripe to notify your app when subscriptions change.

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://kyx-engine.vercel.app/api/webhooks/stripe`
4. **Description**: `KYX Subscription Webhooks`
5. **Select events to listen to**:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
6. **Click "Add endpoint"**
7. **Copy the Signing Secret** (`whsec_...`) and add it to Vercel as `STRIPE_WEBHOOK_SECRET`

---

### Step 5: Configure Stripe Customer Portal

The Customer Portal lets users manage their subscriptions (cancel, change plan, update payment method).

1. **Go to**: https://dashboard.stripe.com/settings/billing/portal
2. **Click "Activate test link"** (if in test mode) or configure settings
3. **Configure features**:
   - ✅ **Cancel subscriptions**: Allow customers to cancel
   - ✅ **Update subscriptions**: Allow plan changes (upgrade/downgrade)
   - ✅ **Update payment methods**: Allow card updates
4. **Set branding** (optional):
   - Add your KYX logo
   - Add your brand colors
   - Add support email
5. **Click "Save changes"**

---

### Step 6: Test the Flow (IMPORTANT!)

Before going live, test with **Test Mode** in Stripe:

1. **Use Test Credit Card**: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any 5-digit ZIP code

2. **Test the subscription flow**:
   - Go to `/pricing` on your site
   - Click "Upgrade Now" on Pro plan
   - Complete checkout with test card
   - Verify you're redirected to dashboard with success message
   - Check that your subscription tier updated in the dashboard
   - Try creating a game (should increment counter)
   - Go to `/settings` and click "Manage Subscription"
   - Verify Stripe portal opens
   - Test canceling subscription
   - Verify it downgrades to free tier

3. **Test webhooks are working**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click on your webhook endpoint
   - Check that events are being received successfully (green checkmarks)

---

## 🎮 Subscription Tiers Summary

### 🆓 Free Tier
- 3 games per month
- Basic AI generation
- Private games ✅
- Standard build queue
- **Price**: $0/month

### ⭐ Pro Tier
- 20 games per month
- Advanced AI generation
- **Custom sprite uploads** ✅
- Private games ✅
- Priority build queue
- **Price**: $5/month

### 💎 Premium Tier
- **Unlimited games**
- Best AI generation
- **Custom sprite uploads** ✅
- Private games ✅
- **Fastest build queue** (priority)
- Early access to new features
- **Price**: $15/month

---

## 🔒 Security Notes

1. **Never commit** `.env.local` or any file containing Stripe keys to Git
2. **Use Test Mode keys** for development
3. **Only use Live Mode keys** in production environment variables
4. **Verify webhook signatures** - the code already does this for security
5. **Keep webhook secret secure** - never expose in client-side code

---

## 🚀 Going Live

When you're ready to go live:

1. **Switch to Live Mode** in Stripe Dashboard (toggle in top-right)
2. **Create the same products** in Live Mode (Pro & Premium)
3. **Update environment variables** in Vercel with **Live Mode keys**
4. **Create a new webhook endpoint** in Live Mode
5. **Test one real subscription** with a real card (you can cancel immediately)
6. **Verify everything works** before announcing to users

---

## 📊 Monitoring Subscriptions

### Stripe Dashboard:
- **Customers**: View all subscribers
- **Subscriptions**: View active/canceled subscriptions
- **Payments**: View successful/failed payments
- **Webhooks**: Monitor webhook deliveries

### Supabase Dashboard:
- **SQL Editor**: Query profiles table to see subscription tiers
- **Table Editor**: View profiles → subscription fields

Example query to see subscription breakdown:
```sql
SELECT 
  subscription_tier, 
  COUNT(*) as user_count 
FROM profiles 
GROUP BY subscription_tier;
```

---

## 🐛 Troubleshooting

### Issue: Webhook events not being received
**Solution**: 
- Check webhook endpoint URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check Vercel logs for webhook errors
- Test webhook using Stripe Dashboard "Send test webhook"

### Issue: Subscription not updating after checkout
**Solution**:
- Check webhook is configured with correct events
- Check webhook secret matches environment variable
- Look at Stripe webhook logs for errors
- Verify user has `stripe_customer_id` in profiles table

### Issue: Users seeing wrong tier limits
**Solution**:
- Check `games_created_this_month` is resetting monthly
- Verify `subscription_tier` in profiles table matches Stripe
- Check webhook successfully updated the profile

### Issue: Custom sprites not working for Pro users
**Solution**:
- Verify `game-sprites` bucket exists in Supabase Storage
- Check RLS policies allow uploads (see `SPRITE_UPLOAD_SETUP.md`)
- Verify `canUseCustomSprites()` check in lab page

---

## 📝 Monthly Reset Function

The database includes a function to reset `games_created_this_month` counter.

**Option 1: Manual** (run this monthly in SQL Editor):
```sql
SELECT public.reset_monthly_game_counts();
```

**Option 2: Automated** (requires Supabase Pro with pg_cron):
```sql
-- Run at midnight on the 1st of every month
SELECT cron.schedule(
    'reset-monthly-game-counts',
    '0 0 1 * *',
    'SELECT public.reset_monthly_game_counts();'
);
```

---

## 🎉 You're All Set!

Your subscription system is production-ready! Here's what users will experience:

1. **New User** → Starts on Free tier (3 games/month)
2. **Wants More** → Clicks "Upgrade" → Chooses Pro or Premium
3. **Checkout** → Enters card → Subscribes → Redirected to dashboard
4. **Subscription Active** → Higher limits, custom sprites, priority builds
5. **Wants to Cancel** → Goes to Settings → "Manage Subscription" → Stripe Portal → Cancel
6. **Canceled** → Downgraded to Free tier at period end

---

## 📞 Need Help?

- **Stripe Docs**: https://stripe.com/docs/billing/subscriptions/overview
- **Stripe Support**: https://support.stripe.com/
- **Supabase Docs**: https://supabase.com/docs

---

## 🔗 Important URLs

- **Pricing Page**: https://kyx-engine.vercel.app/pricing
- **Dashboard**: https://kyx-engine.vercel.app/dashboard
- **Settings**: https://kyx-engine.vercel.app/settings
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Webhooks**: https://dashboard.stripe.com/webhooks
- **Stripe Products**: https://dashboard.stripe.com/products

---

**Happy monetizing! 💰**

