# Brotherhood Legacy (BHL) — Official Platform

> A high-fidelity, community-driven ecosystem for elite **Gaming**, **Music**, **Sport**, and **Content** creators. Built on cinematic aesthetics, deep gamification, automated community pipelines, and exclusive merit-locked commerce.

🌐 **Live**: [bhl-website.vercel.app](https://bhl-website.vercel.app)

---

## ⚔️ The Gamification System

BHL operates on a fully organic, XP-driven meritocracy. Every action on the platform is tracked, calculated, and converted into progression status.

### How to Earn XP

| Action | XP Reward | Notes |
| :--- | :--- | :--- |
| **Daily Login** | +10 XP | Tracks active engagement |
| **Join Division** | +20 XP | One-time reward per division |
| **Submit Challenge** | Variable | Admin-reviewed; XP set per challenge |

### 🏆 Ranks & Progression

The Brotherhood uses a **fully admin-configurable rank system** powered by `lib/xp.ts`. Level thresholds and titles are stored in `SystemSettings.levelProgression` and managed through the admin XP panel — no hardcoded caps.


> [!IMPORTANT]
> **Conqueror Drops**: Premium merchandise and limited-edition releases are strictly reserved for members at **Conqueror rank (40,000+ XP)**. Lower-ranked members cannot purchase locked products even if they find the URL.

---

## 🌎 Divisions

Choose your path and dominate your field:

| Division | Focus |
| :--- | :--- |
| 🎮 **Gaming** | Competitive play, scrims, and tournament domination |
| 🎵 **Music** | Artist collaboration, track drops, and sound engineering |
| 💪 **Sport** | Physical excellence, fitness challenges, and athletic growth |
| 🎬 **Content** | Content creation, digital branding, and viral strategy |

Members can join multiple divisions. Each division tracks its own leaderboard and member count via precomputed `DivisionStat` documents. Division XP is tracked separately from global XP via the `divisionXp` map on the `User` model.

---

## 📡 Community & Creator Sync

BHL features a fully automated content pipeline that keeps the community page alive and dynamic:

- **YouTube Sync Engine** — Vercel Cron job (`/api/cron/youtube-sync`, daily at 04:00 UTC) caches creator videos from YouTube Data API v3 into `CreatorVideo` documents.
- **Instant Sync on Profile Update** — When a creator's YouTube URL changes or their public visibility is toggled on, `syncCreator()` runs immediately in the same API request.
- **Manual Sync Trigger** — Admin panel provides a one-click manual sync at `/api/admin/youtube/sync`.
- **Twitch Live Integration** — `TwitchLiveCarousel` on the Community page fetches `/api/twitch/live` to display real-time live stream status for BHL creators.
- **Auto-Cycling Carousels** — High-fidelity creator video showcases sorted by community XP ranking.
- **Organic Ranking** — Community directory and leaderboards are always sorted by `xp: -1` — no manual ordering.
- **Public User Profiles** — Every member has a public-facing profile at `/users/[id]` with their rank, divisions, stats, social links, and approved challenge history.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Server & Client Components) |
| **Language** | TypeScript 5 |
| **UI Motion** | Framer Motion 12 |
| **Icons** | Lucide React + React Icons |
| **Database** | MongoDB via Mongoose 9 (Atlas) |
| **Authentication** | JWT-based sessions (bcryptjs, jsonwebtoken) |
| **Email** | Nodemailer with Gmail SMTP |
| **Image Handling** | react-easy-crop with client-side canvas crop |
| **Hosting** | Vercel (ISR + Edge Network) |
| **Cron Jobs** | Vercel Cron — daily YouTube creator sync (04:00 UTC) |
| **Real-Time** | Server-Sent Events (SSE) via `/api/realtime` |
| **Styling** | Vanilla CSS with design tokens, glassmorphism, 8px spacing system |

---

## 🗂️ Project Structure

```
/app
  /(main)                     → Public-facing routes (Rajdhani glassmorphism UI)
    /page.tsx                 → Home (ISR, 60s revalidate — stats & challenges SSR'd)
    /community                → Community directory & creator showcase (ISR shell, client-fetched data)
    /merch                    → Merchandise store — XP-locked products (Force Dynamic)
    /merch/[id]               → Product detail page
    /checkout                 → Order checkout flow (client-rendered)
    /apply                    → Division application form
    /profile                  → Authenticated user profile (client-rendered)
    /users/[id]               → Public member profiles (Force Dynamic, JSON-LD, per-user OG)
  /admin                      → Admin command center (role-gated: admin / superadmin)
    /members                  → Member management & XP editing
    /products                 → Merchandise & stock management
    /challenges               → Challenge CRUD
    /submissions              → Challenge submission review pipeline
    /orders                   → Order management
    /applications             → Division application review
    /users                    → User account management
    /referrals                → Referral tracking
    /tags                     → Tag management
    /xp                       → XP award tools & level progression config
  /login                      → Login page
  /register                   → Registration page
  /forgot-password            → Password reset request
  /reset-password             → Password reset handler
  /api                        → REST API routes (see below)

/components                   → Shared React components
/models                       → Mongoose data models
/lib                          → Core utilities
  animations.ts               → Framer Motion variant definitions
  auth.ts                     → JWT helpers & role cache
  db.ts                       → MongoDB connection singleton
  image.ts                    → Image processing helpers
  leader-sync.ts              → syncDivisionStats() — updates DivisionStat docs
  mail.ts                     → Nodemailer Gmail SMTP wrapper
  progression-server.ts       → getDynamicProgression() — reads SystemSettings thresholds
  realtime-updates.ts         → SSE pub/sub via global subscriber map
  stats.ts                    → getGlobalStats() & getLiveStats() with unstable_cache
  useProgression.ts           → Client-side progression hook
  xp.ts                       → XP actions, level calculation, badge definitions
  /server
    twitch.ts                 → Twitch API integration
    youtube.ts                → syncCreator() & bulk YouTube sync logic
/contexts                     → React Context providers
/hooks                        → Custom React hooks
/scripts                      → DB seed scripts
/benchmark                    → Performance benchmarking tools
```

---

## 🔌 API Routes

### Public
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/*` | POST | Login, register, token refresh, forgot/reset password |
| `/api/users` | GET | User profile lookup |
| `/api/users/[id]` | GET / PATCH | User fetch & update (division join/leave, profile edits) |
| `/api/stats` | GET | Global platform stats (`unstable_cache`, 3600s, tag: `stats`) |
| `/api/leaderboard` | GET | XP-ranked leaderboard |
| `/api/community` | GET | Community directory |
| `/api/challenges` | GET / POST | Challenge listing & creation |
| `/api/submissions` | GET / POST | Submit challenge proof |
| `/api/products` | GET | Public product listing |
| `/api/orders` | GET / POST | Order placement & history |
| `/api/referrals` | GET / POST | Referral tracking |
| `/api/countries` | GET | Country list for profiles |
| `/api/upload` | POST | Avatar/image upload handler |
| `/api/progression` | GET | Dynamic level thresholds from SystemSettings |
| `/api/realtime` | GET (SSE) | Server-Sent Events — live division/XP updates |
| `/api/xp` | POST | Daily login XP claim |
| `/api/twitch/live` | GET | Live stream status for BHL creators |
| `/api/applications` | GET / POST | Division application submission |

### Admin-Only (`/api/admin/*`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/admin/submissions/[id]` | PATCH | Approve / reject / revoke submission + XP award |
| `/api/admin/users/[id]` | PATCH | User management (username: superadmin only) |
| `/api/admin/tags` | GET / POST / DELETE | Tag management |
| `/api/admin/referrals` | GET | Referral analytics |
| `/api/admin/notifications` | GET / POST | Platform notifications |
| `/api/admin/progression` | GET / POST | Level progression config |
| `/api/admin/youtube/sync` | POST | Manual creator YouTube sync trigger |

### Cron
| Endpoint | Schedule | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/cron/youtube-sync` | Daily 04:00 UTC | `CRON_SECRET` | Full creator YouTube sync |

---

## 🗃️ Data Models

| Model | Purpose |
| :--- | :--- |
| `User` | Member accounts: XP, level, divisions, `divisionXp`, rank, avatar, social links, YouTube channel metadata, badges |
| `Challenge` | Community challenges with XP rewards, deadlines, and division targeting |
| `Submission` | Challenge proof submissions — `pending` → `approved` / `rejected` / `revoked` |
| `Product` | Merchandise with XP-lock threshold, stock, pricing, and image |
| `Order` | Purchase history and order status tracking |
| `Application` | Division join applications with admin review flow |
| `Referral` | Referral link tracking between members |
| `CreatorVideo` | Cached YouTube video metadata per creator (refreshed daily by cron) |
| `DivisionStat` | Precomputed per-division member counts & top-XP leader (updated on join/leave/approval) |
| `SystemSettings` | Global platform config: `levelProgression` thresholds & titles, feature flags, maintenance mode |

---

## ⚡ Rendering Architecture

BHL uses a **Hybrid ISR + Force Dynamic + SSE** strategy:

| Page / Route | Strategy | Revalidation | Notes |
| :--- | :--- | :--- | :--- |
| Home (`/`) | ISR | 60s | Stats & challenges passed as SSR props |
| Community | ISR (shell) | 60s | Data client-fetched on mount |
| Merch | Force Dynamic | Always fresh | Stock & XP-lock never stale |
| Public Profile (`/users/[id]`) | Force Dynamic | Always fresh | Per-user OG + JSON-LD |
| Private Profile | Client-rendered | — | Auth-gated, fetch on mount |
| Admin | Dynamic SSR | Always fresh | Role-gated |
| `/api/stats` | `unstable_cache` | 3600s (`stats` tag) | Purged on submission approval |
| `/api/realtime` | SSE (long-lived) | — | Push updates to all open tabs |
| `/api/progression` | Force Dynamic | — | Admin-configurable thresholds |
| `/api/cron/youtube-sync` | Vercel Cron | Daily 04:00 UTC | Refreshes `CreatorVideo` docs |

### Cache Invalidation Triggers
On mutations that affect global state:

```
Submission Approved
  ├── revalidateTag('stats')         → purges global stats cache
  ├── publishRealtimeUpdate(event)   → pushes SSE event to all open tabs
  └── syncDivisionStats(divId)       → updates DivisionStat document

Join / Leave Division
  ├── syncDivisionStats(divId)       → updates DivisionStat document
  └── publishRealtimeUpdate(event)   → pushes SSE event to all open tabs
```

---

## 🛡️ Administrative Infrastructure

The `/admin` command center is role-gated (`admin` / `superadmin` only):

- **Members Panel** — High-density member table with inline XP editing and division management
- **Products Panel** — 2-column grid for merchandise with stock levels and XP-lock configuration
- **Submissions Pipeline** — Real-time review queue: approve (awards XP + badges), reject, or revoke (deducts XP)
- **Applications Review** — Manage and approve division join applications
- **Orders Dashboard** — Full order history with status management
- **YouTube Sync** — Manual trigger for creator content synchronization
- **XP Tools** — Bulk and individual XP award utilities; configure level progression thresholds & titles
- **Tags** — Community tag system management
- **Referrals** — Referral chain tracking and analytics
- **Users** — Account management (username changes restricted to `superadmin`)
- **Notifications** — Platform-wide notification dispatch

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)
- YouTube Data API v3 key (for creator sync)
- Twitch Client ID + Secret (for live stream integration)
- Gmail account with App Password (for transactional emails)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/samishating/bhl_website.git
   cd bhl_website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env.local`:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string

   # Security
   JWT_SECRET=your_secure_jwt_secret
   CRON_SECRET=your_vercel_cron_secret

   # YouTube API
   YOUTUBE_API_KEY=your_youtube_data_api_v3_key

   # Twitch API
   TWITCH_CLIENT_ID=your_twitch_client_id
   TWITCH_CLIENT_SECRET=your_twitch_client_secret

   # Email (Gmail SMTP via Nodemailer)
   GMAIL_USER=your_gmail_address
   GMAIL_PASS=your_google_app_password

   # App
   NEXT_PUBLIC_SITE_URL=https://bhl-website.vercel.app
   ```

4. (Optional) Seed the database:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🛡️ Development Standards

| Standard | Rule |
| :--- | :--- |
| **Spacing** | 8px scale — use `--space-xs/sm/md/lg` tokens |
| **Avatars** | Square/squircle only. **Never** `border-radius: 50%` |
| **Ranking** | Always `sort({ xp: -1 })`. No manual order fields |
| **Borders** | `1px solid var(--border)`, hover: `var(--border-hover)` |
| **Rounding** | `var(--radius-md)` (12px) for inputs/buttons, `var(--radius-lg)` (20px) for cards/modals |
| **Alerts** | No `alert()`, `confirm()`, or `prompt()`. Use custom modals |
| **Single Select** | Use `.selection-pill` / `.selection-pill-group` (shared `layoutId`) |
| **Multi Select** | Use `.multi-chip-group` / `.multi-chip` (independent toggles) |
| **Motion** | Framer Motion — `fadeUp`, `scaleIn`, `stagger` variants. Respect `useReducedMotion()` |
| **State Sync** | All global mutations must dispatch `stats-refresh` event and call `publishRealtimeUpdate()` |
| **Production** | Validate at `https://bhl-website.vercel.app` — never localhost |
| **Level Config** | Thresholds and titles are managed via Admin → XP panel. Never hardcode rank data |

---

© 2026 Brotherhood Legacy. All rights reserved.
