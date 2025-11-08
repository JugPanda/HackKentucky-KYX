-- KYX Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
);

-- Games table (stores user-created games)
CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL, -- Full game config
    status TEXT NOT NULL DEFAULT 'draft', -- draft, building, built, published, failed
    visibility TEXT NOT NULL DEFAULT 'private', -- private, unlisted, public
    bundle_url TEXT, -- URL to the built game bundle in storage
    bundle_size INTEGER, -- Size in bytes
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_user_slug UNIQUE(user_id, slug),
    CONSTRAINT status_check CHECK (status IN ('draft', 'building', 'built', 'published', 'failed')),
    CONSTRAINT visibility_check CHECK (visibility IN ('private', 'unlisted', 'public'))
);

-- Build queue table (for async build processing)
CREATE TABLE IF NOT EXISTS public.build_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT build_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_game_like UNIQUE(user_id, game_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT comment_length CHECK (char_length(content) >= 1 AND char_length(content) <= 1000)
);

-- Reported content table (for moderation)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT report_status_check CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    CONSTRAINT report_target_check CHECK (
        (reported_user_id IS NOT NULL) OR 
        (game_id IS NOT NULL) OR 
        (comment_id IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_games_user_id ON public.games(user_id);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_visibility ON public.games(visibility);
CREATE INDEX idx_games_published_at ON public.games(published_at DESC) WHERE visibility = 'public';
CREATE INDEX idx_build_queue_status ON public.build_queue(status);
CREATE INDEX idx_likes_game_id ON public.likes(game_id);
CREATE INDEX idx_comments_game_id ON public.comments(game_id);
CREATE INDEX idx_reports_status ON public.reports(status);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Games policies
CREATE POLICY "Public games are viewable by everyone"
    ON public.games FOR SELECT
    USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can insert own games"
    ON public.games FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own games"
    ON public.games FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own games"
    ON public.games FOR DELETE
    USING (auth.uid() = user_id);

-- Build queue policies
CREATE POLICY "Users can view own build queue"
    ON public.build_queue FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own build jobs"
    ON public.build_queue FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
    ON public.likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like games"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike games"
    ON public.likes FOR DELETE
    USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can comment"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
    ON public.comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can view own reports"
    ON public.reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can report content"
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- Functions

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update game like count
CREATE OR REPLACE FUNCTION public.update_game_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.games
        SET like_count = like_count + 1
        WHERE id = NEW.game_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.games
        SET like_count = like_count - 1
        WHERE id = OLD.game_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update like counts
DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.update_game_like_count();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update timestamps
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_games_updated_at ON public.games;
CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON public.games
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for game bundles (run in Supabase Storage UI or via SQL)
-- This creates a public bucket for game bundles
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-bundles', 'game-bundles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view public game bundles"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'game-bundles');

CREATE POLICY "Authenticated users can upload game bundles"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'game-bundles' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own game bundles"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'game-bundles' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own game bundles"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'game-bundles' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

