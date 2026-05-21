# Brotherhood Legacy (BHL) — Official Platform

> A high-fidelity, community-driven ecosystem for elite **Gaming**, **Music**, **Sport**, and **Content** creators. Built on cinematic aesthetics, deep gamification, automated community pipelines, and exclusive merit-locked commerce.

🌐 **Live**: [bhl-website.vercel.app](https://bhl-website.vercel.app)

---

## ⚔️ The Gamification System

BHL operates on a fully organic, XP-driven meritocracy. Every action on the platform is tracked, calculated, and converted into progression status.

### How to Earn XP

| Action | XP Reward | Notes |
| :--- | :--- | :--- |
| **Daily Login** | +10 XP | Tracks active engagement streaks |
| **Join Division** | +20 XP | One-time reward per division |
| **Submit Challenge** | +50–500 XP | Admin-reviewed; XP varies by difficulty |

### 🏆 Ranks & Progression

The Brotherhood uses **30 elite ranks** powered by the `lib/xp.ts` engine.

| Level | Title | XP Required | Milestone |
| :--- | :--- | :--- | :--- |
| 1 | **Recruit** | 0 XP | Entry into the Brotherhood |
| 5 | **Member** | 1,000 XP | **Ranked Badge** unlocked |
| 15 | **Legend** | 20,000 XP | **Veteran Status** achieved |
| 23 | **Conqueror** | 40,000 XP | **Exclusive Drop Access** (Merch Lock) |
| 25 | **Immortal** | 44,000 XP | Elite circle membership |
| 30 | **Eternal Legacy** | 50,000 XP | Ultimate Ascension |

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

Members can join multiple divisions. Each division tracks its own leaderboard and member count via precomputed `DivisionStat` documents.

---

## 📡 Community & Creator Sync

BHL features a fully automated content pipeline that keeps the community page alive and dynamic:

- **YouTube Sync Engine** — Server-side cron job (`/api/cron/youtube-sync`) caches creator videos from YouTube Data API v3.
- **Manual Sync Trigger** — Admin panel provides a one-click manual sync at `/api/admin/youtube/sync`.
- **Auto-Cycling Carousels** — High-fidelity creator video showcases sorted by community XP ranking.
- **Organic Ranking** — Community directory and leaderboards are always sorted by `xp: -1` — no manual ordering.
- **Public User Profiles** — Every member has a public-facing profile at `/users/[username]` with their rank, divisions, stats, and social links.

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
| **Cron Jobs** | Vercel Cron for daily creator sync |
| **Styling** | Vanilla CSS with design tokens, glassmorphism, 8px spacing system |

---

## 🗂️ Project Structure

```
/app
  /(main)           → Public-facing routes
    /page.tsx       → Home (ISR, 60s revalidate)
    /community      → Community directory & creator showcase
    /merch          → Merchandise store (XP-locked products)
    /checkout       → Order checkout flow
    /apply          → Division application
    /profile        → Authenticated user profile
    /users/[username] → Public member profiles
  /admin            → Admin command center (role-gated)
    /members        → Member management & XP editing
    /products       → Merchandise & stock management
    /challenges     → Challenge CRUD
    /submissions    → Challenge submission review pipeline
    /orders         → Order management
    /applications   → Division application review
    /users          → User account management
    /referrals      → Referral tracking
    /tags           → Tag management
    /xp             → XP award tools
  /auth             → Login, Register, Forgot/Reset Password
  /api              → REST API routes (see below)

/components         → Shared React components
/models             → Mongoose data models
/lib                → Core utilities (xp.ts, stats.ts, db.ts, auth.ts)
/contexts           → React Context providers
/hooks              → Custom React hooks
/scripts            → DB seed scripts
```

---

## 🔌 API Routes

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/*` | POST | Login, register, token refresh |
| `/api/users` | GET/PATCH | User profile fetch & update |
| `/api/stats` | GET | Global platform stats (cached 60s) |
| `/api/leaderboard` | GET | XP-ranked leaderboard |
| `/api/community` | GET | Community directory |
| `/api/challenges` | GET/POST | Challenge listing & submission |
| `/api/submissions` | GET/POST | Submit challenge proof |
| `/api/products` | GET | Public product listing |
| `/api/orders` | GET/POST | Order placement & history |
| `/api/referrals` | GET/POST | Referral tracking |
| `/api/countries` | GET | Country list for profiles |
| `/api/upload` | POST | Avatar/image upload handler |
| `/api/progression` | GET | User rank & XP progression |
| `/api/realtime` | GET | SSE endpoint for live updates |
| `/api/xp` | POST | XP claim (daily login reward) |
| `/api/admin/*` | Various | Admin-only management endpoints |
| `/api/cron/youtube-sync` | POST | Vercel Cron — YouTube sync (CRON_SECRET gated) |

---

## 🗃️ Data Models

| Model | Purpose |
| :--- | :--- |
| `User` | Member accounts: XP, level, divisions, rank, avatar, social links |
| `Challenge` | Community challenges with XP rewards and deadlines |
| `Submission` | Challenge proof submissions awaiting admin review |
| `Product` | Merchandise with XP-lock, stock, pricing, and image |
| `Order` | Purchase history and order status tracking |
| `Application` | Division join applications |
| `Referral` | Referral link tracking between members |
| `CreatorVideo` | Cached YouTube video metadata per creator |
| `DivisionStat` | Precomputed per-division member counts & XP aggregates |
| `SystemSettings` | Global platform config (maintenance mode, feature flags) |

---

## ⚡ Rendering Architecture

BHL uses a **Hybrid ISR + Dynamic SSR** strategy:

| Page / Route | Strategy | Revalidation |
| :--- | :--- | :--- |
| Home (`/`) | ISR + client-side stat overlay | 60s |
| Community | ISR | 60s |
| Division Pages | Pure Dynamic SSR | Always fresh |
| User Dashboard | Pure Dynamic SSR | Always fresh |
| `/api/stats` | Dynamic + `unstable_cache` | 60s (tag: `stats`) |

On actions that modify global state (join division, approve submission), the system triggers:
- `revalidateTag('stats')` — purges the stats cache
- `revalidatePath('/', 'layout')` — queues a fresh home page build
- `window.dispatchEvent(new Event('stats-refresh'))` — syncs all open client tabs

---

## 🛡️ Administrative Infrastructure

The `/admin` command center is role-gated (`admin` / `superadmin` only):

- **Members Panel** — High-density member table with inline XP editing and division management
- **Products Panel** — 2-column grid for merchandise with stock levels and XP-lock configuration
- **Submissions Pipeline** — Real-time review queue for challenge proofs (approve/reject with XP auto-award)
- **Applications Review** — Manage and approve division join applications
- **Orders Dashboard** — Full order history with status management
- **YouTube Sync** — Manual trigger for creator content synchronization
- **XP Tools** — Bulk and individual XP award utilities
- **Tags** — Community tag system management
- **Referrals** — Referral chain tracking and analytics
- **Users** — Account management (username changes restricted to `superadmin`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)
- YouTube Data API v3 key (for creator sync)
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
| **State Sync** | All global mutations must dispatch `stats-refresh` event |
| **Production** | Validate at `https://bhl-website.vercel.app` — never localhost |

---

© 2026 Brotherhood Legacy. All rights reserved.
