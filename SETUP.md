# KYX Platform Setup Guide

This guide will help you set up the complete KYX platform with authentication, database, and community features.

## Prerequisites

- **Python 3.8+** with pygame-ce and pygbag installed
- **Node.js 18+** and npm
- **Supabase Account** (free tier works fine)

## Step 1: Clone and Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
cd landing-page
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned (2-3 minutes)

### 2.2 Run Database Migrations

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `landing-page/supabase-schema.sql`
4. Click **Run** to execute the SQL

This will create all necessary tables:
- `profiles` - User profiles
- `games` - User-created games
- `build_queue` - Async build job tracking
- `likes` - Game likes
- `comments` - Game comments
- `reports` - Content moderation reports

### 2.3 Set Up Storage

1. Go to **Storage** in your Supabase dashboard
2. The `game-bundles` bucket should be created automatically by the schema
3. If not, create it manually and make it **public**

### 2.4 Enable Authentication Providers

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider (enabled by default)
3. *Optional*: Enable **GitHub** OAuth:
   - Create a GitHub OAuth App at https://github.com/settings/developers
   - Add the callback URL: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

## Step 3: Configure Environment Variables

Create a `.env.local` file in the `landing-page` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Python interpreter path (optional, defaults to python3)
KYX_PYTHON=python3
```

**Where to find these values:**
- Go to your Supabase project **Settings** > **API**
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 4: Run the Development Server

```bash
cd landing-page
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 5: Test the Platform

### Test Authentication
1. Go to `/auth/sign-up` and create an account
2. Check your email for the confirmation link
3. Sign in at `/auth/sign-in`

### Create Your First Game
1. After signing in, go to `/lab`
2. Fill out the game creation form
3. Enter a prompt like "cozy rooftop adventure with neon lights"
4. Submit to create the game

### Build and Publish
1. Go to `/dashboard` to see your games
2. Click **Build** to start the pygbag build process
3. Wait for the build to complete (check status in build queue)
4. Once built, click **Publish** to make it public
5. View your game at `/community/[username]/[slug]`

## Features Overview

### ✅ Completed Features

1. **Expanded Config Schema**
   - Room layouts with custom platforms
   - Enemy positions and behaviors
   - Gameplay mechanics toggles

2. **AI Prompt Parser**
   - Generates complete game configs from text descriptions
   - Procedural room generation based on difficulty
   - Theme-based color palettes

3. **Authentication System**
   - Email/password authentication
   - GitHub OAuth support
   - Protected routes and middleware

4. **Database Schema**
   - User profiles with usernames and bios
   - Games with status tracking
   - Build queue for async processing
   - Likes, comments, and moderation

5. **Async Build Queue**
   - Non-blocking game builds
   - Status tracking (pending → processing → completed/failed)
   - Automatic pygbag execution

6. **Cloud Storage**
   - Supabase Storage integration
   - Public game bundles
   - User-specific folders

7. **Community Pages**
   - Browse published games
   - User profiles
   - Game detail pages with embedded players

8. **Publish/Unpublish Workflow**
   - Visibility controls (private, unlisted, public)
   - Publish timestamps
   - Status management

9. **Moderation Tools**
   - Content filtering (profanity, spam patterns)
   - Rate limiting (builds, comments, reports)
   - Admin dashboard for reviewing reports

10. **User Dashboard**
    - Manage all your games
    - View stats (likes, plays, total games)
    - Quick actions (build, publish, edit)

## API Endpoints

### Games
- `POST /api/games/create` - Create a new game
- `POST /api/games/build` - Queue a game build
- `GET /api/games/build?gameId=xxx` - Check build status
- `POST /api/games/publish` - Change game visibility

### Comments
- `POST /api/comments/create` - Add a comment

### Reports
- `POST /api/reports/create` - Report content

### Config Generation
- `POST /api/generate-config` - Generate config from prompt

## Rate Limits

- **Builds**: 5 per hour per user
- **Game Creation**: 10 per hour per user
- **Comments**: 30 per hour per user
- **Reports**: 5 per hour per user
- **API Requests**: 100 per minute per user

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

**Important**: The build processor requires Python and pygbag. For production:
- Use a separate worker service (Railway, Fly.io, or AWS Lambda)
- Set up a message queue (BullMQ, Redis, AWS SQS)
- Or use Supabase Edge Functions with Deno

### Alternative: Build Worker Setup

For high-volume production, move the build processing to a separate service:

1. Extract `app/api/games/process-build` to a worker
2. Set up a message queue (Redis/BullMQ)
3. Worker polls queue and processes builds
4. Updates Supabase database on completion

## Security Notes

- The `service_role` key has full database access - keep it secret!
- Never commit `.env.local` to git
- Row Level Security (RLS) is enabled on all tables
- Content filtering is basic - enhance for production
- Admin routes need proper role checks (currently any authenticated user)

## Troubleshooting

### Build Fails
- Check Python and pygbag are installed: `python3 -m pip show pygbag`
- Check logs in browser console and terminal
- Verify temp directory permissions

### Supabase Connection Errors
- Verify environment variables are correct
- Check Supabase project is active
- Ensure API keys match your project

### Storage Upload Fails
- Check storage policies in Supabase dashboard
- Verify bucket is public
- Check user authentication

## Next Steps

1. Customize the game engine (`demo-game/main.py`)
2. Add more themes and palettes
3. Implement proper admin roles
4. Add social features (followers, collections)
5. Set up analytics and monitoring
6. Enhance content moderation with AI

## Support

- **Documentation**: See `README.md` and `INDEX.md`
- **Database Schema**: `landing-page/supabase-schema.sql`
- **Game Engine**: `demo-game/main.py`

Happy building! 🎮✨

