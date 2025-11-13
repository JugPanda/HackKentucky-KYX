# KYX Engine - AI-Powered Game Creation Platform

**Create playable games with AI.** Describe your game idea in plain English, and KYX will turn it into a real, browser-based game you can share with the world.

🎮 **Live Demo**: [https://kyx-engine.vercel.app](https://kyx-engine.vercel.app)

---

## ✨ Features

### 🤖 AI-Powered Game Generation
- Describe your game in natural language
- GPT-4o-mini generates complete Python/Pygame code
- Support for custom sprites (Pro/Premium)
- Multiple genres: Platformer, Adventure, Puzzle

### 🎯 Complete Platform
- **User Authentication**: Secure sign-up with Supabase
- **Build System**: Python games compiled to WebAssembly (Pygbag)
- **Cloud Storage**: Games hosted on Supabase Storage
- **Community Features**: Share, like, comment, and discover games
- **Dashboard**: Manage your games, track stats, publish/unpublish
- **Subscription Tiers**: Free, Pro, and Premium plans with Stripe

### 💎 Subscription Plans

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Games per month | 3 | 20 | Unlimited |
| Custom sprites | ❌ | ✅ | ✅ |
| Build priority | Standard | Priority | Fastest |
| Private games | ✅ | ✅ | ✅ |
| Early features | ❌ | ❌ | ✅ |

---

## 🏗️ Architecture

### Components

1. **Landing Page** (`landing-page/`) - Next.js 15 application
   - Marketing site and game creator
   - User dashboard and community pages
   - Supabase authentication and storage
   - Stripe subscription management

2. **Build Service** (`build-service/`) - Python Flask service  
   - Compiles Python games with Pygbag
   - Deploys to Supabase Storage
   - Deployed on Fly.io

3. **Demo Game** (`demo-game/`) - Sample game template
   - Pygame-CE based platformer
   - Hollow Knight-inspired mechanics
   - WebAssembly-ready

### Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI GPT-4o-mini
- **Payments**: Stripe
- **Build Service**: Python Flask, Pygbag, Pygame-CE
- **Deployment**: Vercel (frontend), Fly.io (build service)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+ (for local game development)
- Supabase account
- OpenAI API key
- Stripe account (optional, for payments)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/kyx-engine.git
cd kyx-engine/landing-page
npm install
```

### 2. Configure Environment

Create `landing-page/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Build Service
BUILD_SERVICE_URL=your_build_service_url
BUILD_SERVICE_SECRET=your_shared_secret

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# Stripe (optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PRICE_ID_PRO=price_xxx
STRIPE_PRICE_ID_PREMIUM=price_xxx
```

### 3. Set Up Database

Run the migrations in your Supabase SQL editor:

```bash
landing-page/supabase-schema.sql
landing-page/supabase-migration-subscriptions.sql
```

### 4. Deploy Build Service

Follow the [Build Service Guide](./build-service/DEPLOY_GUIDE.md) to deploy to Fly.io.

### 5. Run Development Server

```bash
cd landing-page
npm run dev
```

Visit `http://localhost:3001`

---

## 📖 Documentation

- **[Setup Guide](./SETUP.md)** - Complete setup instructions
- **[Architecture](./ARCHITECTURE.md)** - System design and data flow
- **[Build Service](./build-service/DEPLOY_GUIDE.md)** - Deployment guide for build service
- **[Stripe Setup](./STRIPE_SETUP_GUIDE.md)** - Payment integration guide
- **[Sprite Upload](./SPRITE_UPLOAD_SETUP.md)** - Custom sprite configuration
- **[Build Service Setup](./BUILD_SERVICE_SETUP.md)** - Build service configuration

---

## 🎮 Game Development

### Local Development

```bash
cd demo-game
python main.py
```

### Build for Web

```bash
cd demo-game
pygbag main.py
```

The game will be compiled to WebAssembly and served at `http://localhost:8000`.

### Controls

| Action | Input |
|--------|-------|
| Move | Arrow keys or WASD |
| Sprint | Shift |
| Dash | Ctrl / J |
| Jump | Space (hold for higher) |

---

## 🚢 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables from `.env.local`
4. Deploy!

### Build Service (Fly.io)

```bash
cd build-service
fly launch
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
fly deploy
```

---

## 🔐 Security

- User authentication via Supabase Auth
- Row Level Security (RLS) on all tables
- Content filtering and rate limiting
- Secure file uploads to Supabase Storage
- Webhook signature verification for Stripe
- Shared secret authentication for build service

---

## 📊 Features in Detail

### AI Game Generation
- Natural language game descriptions
- Automatic code generation with GPT-4o-mini
- Support for custom player/enemy sprites
- Multiple game genres and difficulty levels
- Tone customization (hopeful, gritty, heroic)

### Community Platform
- Browse games created by others
- Like and comment on games
- User profiles with game galleries
- Game statistics (plays, likes)
- Content moderation tools

### Dashboard
- View all your games
- Track build status in real-time
- Publish/unpublish games
- Edit game details
- View analytics and stats

### Subscription System
- Free tier with basic features
- Pro tier for serious creators
- Premium tier for unlimited creation
- Stripe-powered billing
- Customer portal for self-service

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- AI by [OpenAI](https://openai.com/)
- Payments by [Stripe](https://stripe.com/)
- Games compiled with [Pygbag](https://github.com/pygame-web/pygbag)
- Inspired by Hollow Knight's game mechanics

---

## 📧 Support

For questions or issues, please open an issue on GitHub or contact support.

**Made with ❤️ by the KYX Team**
