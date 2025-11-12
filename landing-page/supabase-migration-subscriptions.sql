-- Add Stripe subscription fields to profiles table
-- Run this in your Supabase SQL Editor

-- Add subscription columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS games_created_this_month INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraint for subscription tier
ALTER TABLE public.profiles
ADD CONSTRAINT subscription_tier_check CHECK (subscription_tier IN ('free', 'pro', 'premium'));

-- Add constraint for subscription status
ALTER TABLE public.profiles
ADD CONSTRAINT subscription_status_check CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'incomplete') OR subscription_status IS NULL);

-- Create index for stripe customer ID lookups (used in webhooks)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Create index for subscription tier (for feature gating queries)
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- Function to reset monthly game counts
-- This should be run monthly (can be set up as a cron job or pg_cron)
CREATE OR REPLACE FUNCTION public.reset_monthly_game_counts()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET 
        games_created_this_month = 0,
        last_reset_date = NOW()
    WHERE 
        -- Reset if it's been more than 30 days since last reset
        last_reset_date < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to run monthly reset
-- Note: Requires pg_cron extension (available on Supabase Pro)
-- SELECT cron.schedule(
--     'reset-monthly-game-counts',
--     '0 0 1 * *', -- Run at midnight on the 1st of every month
--     'SELECT public.reset_monthly_game_counts();'
-- );

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        username, 
        avatar_url,
        subscription_tier,
        games_created_this_month,
        last_reset_date
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        NEW.raw_user_meta_data->>'avatar_url',
        'free', -- All new users start on free tier
        0,      -- Start with 0 games created
        NOW()   -- Set reset date to now
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (to use updated function)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- For existing users, set default values if needed
UPDATE public.profiles
SET 
    subscription_tier = COALESCE(subscription_tier, 'free'),
    games_created_this_month = COALESCE(games_created_this_month, 0),
    last_reset_date = COALESCE(last_reset_date, NOW())
WHERE 
    subscription_tier IS NULL 
    OR games_created_this_month IS NULL 
    OR last_reset_date IS NULL;

