# KYX Platform Architecture

This document describes the technical architecture of the KYX community platform.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Auth Pages  │  │  Community   │  │  Dashboard   │  │
│  │  /auth/*     │  │  /community  │  │  /dashboard  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js 14 Application                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ API Routes                                        │  │
│  │  • /api/games/create      - Create game          │  │
│  │  • /api/games/build       - Queue build          │  │
│  │  • /api/games/process-build - Process build      │  │
│  │  • /api/games/publish     - Publish/unpublish    │  │
│  │  • /api/comments/create   - Add comment          │  │
│  │  • /api/reports/create    - Report content       │  │
│  │  • /api/generate-config   - AI config gen        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Middleware & Utilities                           │  │
│  │  • Supabase Auth Middleware                      │  │
│  │  • Rate Limiting (in-memory)                     │  │
│  │  • Content Filtering                             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌────────────────────────┐      ┌──────────────────────────┐
│   Supabase Backend     │      │   Build Processor        │
│                        │      │                          │
│  ┌──────────────────┐ │      │  ┌────────────────────┐ │
│  │  PostgreSQL DB   │ │      │  │ Python + pygbag    │ │
│  │  • profiles      │ │      │  │ • Temp directories │ │
│  │  • games         │ │      │  │ • Config writing   │ │
│  │  • build_queue   │ │      │  │ • pygbag execution │ │
│  │  • likes         │ │      │  └────────────────────┘ │
│  │  • comments      │ │      │                          │
│  │  • reports       │ │      │  Uploads to:             │
│  └──────────────────┘ │      │    Supabase Storage     │
│                        │      └──────────────────────────┘
│  ┌──────────────────┐ │
│  │  Storage         │ │
│  │  • game-bundles  │ │◄─────────────────────┘
│  │    (public)      │ │
│  └──────────────────┘ │
│                        │
│  ┌──────────────────┐ │
│  │  Auth            │ │
│  │  • Email/Pass    │ │
│  │  • GitHub OAuth  │ │
│  └──────────────────┘ │
└────────────────────────┘
```

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components
- **Lucide React** icons

### Backend
- **Next.js API Routes**
- **Supabase**:
  - PostgreSQL database
  - Authentication (email, OAuth)
  - Storage (game bundles)
  - Row Level Security (RLS)

### Game Engine
- **Python 3.12**
- **pygame-ce**
- **pygbag** (WebAssembly builds)

### Tools & Utilities
- **Zod** (schema validation)
- **next-themes** (dark mode)
- Custom rate limiting
- Content filtering utilities

## Data Flow

### 1. User Creates a Game

```
User → /lab
  ↓
Fills form / enters prompt
  ↓
POST /api/generate-config (optional)
  ↓
Returns game config JSON
  ↓
POST /api/games/create
  ↓
Validates config (Zod schema)
  ↓
Inserts into 'games' table
  ↓
Returns game ID
  ↓
Redirects to /dashboard
```

### 2. Building a Game

```
User clicks "Build" → POST /api/games/build
  ↓
Rate limit check (5/hour)
  ↓
Check for existing builds
  ↓
Update game status → 'building'
  ↓
Insert into build_queue → status: 'pending'
  ↓
Async trigger → POST /api/games/process-build
  ↓
Update build_queue → status: 'processing'
  ↓
Create temp directory
  ↓
Write game_config.json
  ↓
Copy main.py
  ↓
Execute: pygbag --build main.py
  ↓
Upload build/web/* to Supabase Storage
  ↓
Update game → bundle_url, status: 'built'
  ↓
Update build_queue → status: 'completed'
  ↓
Cleanup temp files
```

### 3. Publishing a Game

```
User clicks "Publish" → POST /api/games/publish
  ↓
Verify game ownership
  ↓
Check game status (must be 'built')
  ↓
Update game:
  - visibility: 'public'
  - status: 'published'
  - published_at: now()
  ↓
Game appears in /community
```

### 4. Viewing a Game

```
User visits /community/[username]/[slug]
  ↓
Fetch profile by username
  ↓
Fetch game by user_id + slug
  ↓
Check visibility permissions
  ↓
Fetch comments with profiles
  ↓
Render game page with iframe
  ↓
iframe src = bundle_url from Supabase Storage
```

## Database Schema

### Core Tables

#### profiles
- Extends `auth.users`
- Stores username, bio, avatar
- Created automatically on signup via trigger

#### games
- User's created games
- Stores config JSON
- Tracks status (draft → building → built → published)
- Visibility control (private/unlisted/public)

#### build_queue
- Async build job tracking
- Status: pending → processing → completed/failed
- Links to game_id

#### likes
- Many-to-many: users ↔ games
- Auto-updates like_count on games table

#### comments
- User comments on public games
- Joined with profiles for display

#### reports
- Content moderation
- Can target users, games, or comments
- Status: pending → reviewed → resolved/dismissed

### Row Level Security (RLS)

All tables have RLS enabled with policies:

- **profiles**: Public read, users can update own
- **games**: Public read if public visibility, users CRUD own
- **build_queue**: Users can view/create own builds
- **likes**: Public read, users can like/unlike
- **comments**: Public read, authenticated users can CRUD own
- **reports**: Users can view own reports, create new reports

## Security Measures

### Authentication
- Supabase Auth with JWT tokens
- Session managed via middleware
- Protected routes check `auth.uid()`

### Rate Limiting
- In-memory rate limiter (production: use Redis)
- Per-user limits on builds, comments, reports
- Configurable windows and thresholds

### Content Filtering
- Profanity filter on comments/reports
- Spam pattern detection (URLs, emails, phone numbers)
- Username sanitization
- Max length enforcement

### Database Security
- Row Level Security on all tables
- Service role key only for server-side operations
- Parameterized queries (Supabase client)

### Storage Security
- Public bucket for game bundles
- User-specific folders enforced via policies
- Authenticated uploads only

## Scalability Considerations

### Current Limitations (Development)

1. **Build Processing**: Synchronous, blocks during pygbag execution
2. **Rate Limiting**: In-memory, resets on server restart
3. **File Storage**: All in one bucket

### Production Recommendations

#### 1. Separate Build Worker
```
Next.js API → Message Queue (Redis/SQS)
                    ↓
              Worker Service (Railway/Fly.io)
                    ↓
              Process builds async
                    ↓
              Update Supabase directly
```

#### 2. Distributed Rate Limiting
- Use **Redis** with sliding window
- Or **Upstash** (serverless Redis)

#### 3. CDN for Game Bundles
- Serve bundles via Cloudflare or CloudFront
- Supabase Storage → CDN origin

#### 4. Build Optimization
- Cache Python environments
- Parallel builds with workers
- Build artifact compression

#### 5. Monitoring & Observability
- **Sentry** for error tracking
- **Vercel Analytics** for performance
- **Supabase Dashboard** for database metrics

## API Reference

### Game Management

#### Create Game
```
POST /api/games/create
Body: { slug, title, description, config }
Auth: Required
Rate Limit: 10/hour
```

#### Queue Build
```
POST /api/games/build
Body: { gameId }
Auth: Required
Rate Limit: 5/hour
```

#### Check Build Status
```
GET /api/games/build?gameId=xxx
Auth: Required
```

#### Publish/Unpublish
```
POST /api/games/publish
Body: { gameId, visibility: 'private'|'unlisted'|'public' }
Auth: Required
```

### Social Features

#### Create Comment
```
POST /api/comments/create
Body: { gameId, content }
Auth: Required
Rate Limit: 30/hour
```

#### Create Report
```
POST /api/reports/create
Body: { targetType: 'user'|'game'|'comment', targetId, reason }
Auth: Required
Rate Limit: 5/hour
```

### Config Generation

#### Generate from Prompt
```
POST /api/generate-config
Body: { prompt: "describe your game" }
Auth: Optional
Returns: Complete game config JSON
```

## File Structure

```
HackKentucky-KYX/
├── demo-game/
│   ├── main.py                 # Pygame engine
│   ├── game_config.json        # Default config
│   └── build/                  # pygbag output
├── landing-page/
│   ├── app/
│   │   ├── auth/              # Auth pages
│   │   ├── community/         # Community pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── admin/             # Moderation tools
│   │   ├── lab/               # Game creation
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── auth/              # Auth components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── supabase/          # Supabase clients
│   │   ├── schemas.ts         # Zod schemas
│   │   ├── db-types.ts        # TypeScript types
│   │   ├── rate-limit.ts      # Rate limiting
│   │   ├── content-filter.ts  # Content moderation
│   │   └── promptToConfig.ts  # AI config generation
│   ├── middleware.ts           # Auth middleware
│   ├── supabase-schema.sql     # Database migrations
│   └── package.json
├── tools/
│   └── build_game.py          # CLI build helper
├── README.md
├── SETUP.md
├── ARCHITECTURE.md
└── INDEX.md
```

## Future Enhancements

### Short Term
- [ ] Real-time build status with WebSockets
- [ ] Game remixing (fork other users' games)
- [ ] Collections/playlists
- [ ] User profiles with bios and avatars

### Medium Term
- [ ] Advanced game editor UI
- [ ] More game templates
- [ ] Leaderboards and high scores
- [ ] Social features (follow, share)

### Long Term
- [ ] LLM integration for better config generation
- [ ] Multiplayer support
- [ ] Mobile app (React Native)
- [ ] Marketplace for game assets

## Contributing

When contributing, please:
1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Check security implications
5. Test builds locally before pushing

## License

Open source – MIT License

