# Website SSR Architecture: Brotherhood Legacy (BHL)

This document outlines the **Hybrid Rendering Strategy** implemented for the Brotherhood Legacy platform to balance real-time data accuracy, extreme performance, and server scalability.

---

## 1. Core Philosophy: Hybrid Efficiency

The BHL platform uses a multi-layered rendering approach. Public-facing pages are optimized for speed via **Incremental Static Regeneration (ISR)**, while user-specific pages, financial flows, and stat mutations remain fully dynamic. A real-time SSE layer bridges the gap between static caches and live leaderboard data.

---

## 2. Rendering Strategies by Route

### A. Home Page (`/`)
- **Strategy**: ISR (`revalidate = 60`)
- **Behavior**: Served from Vercel's static cache, regenerated in the background every 60 seconds.
- **SSR Data**: `getGlobalStats()` and the latest 6 global challenges are fetched server-side at build/revalidation time and passed as props to client components.
- **Live Overlay**: `CinematicHero` receives `statsData` as initial props; division stat cards are hydrated via `HomeDivisions` with the ISR snapshot. No additional client-side fetch is required for the initial paint.

### B. Community Page (`/community`)
- **Strategy**: ISR (`revalidate = 60`)
- **Behavior**: Shell page is statically cached. All member listing, filtering, and creator video carousels are fetched client-side inside `CommunityClient` on mount.
- **Twitch Integration**: A dedicated `TwitchLiveCarousel` component fetches `/api/twitch/live` on the client to display real-time live stream status.

### C. Merch Store (`/merch`)
- **Strategy**: Pure Dynamic SSR (`dynamic = 'force-dynamic'`, `revalidate = 0`)
- **Behavior**: Products are fetched fresh from MongoDB on every request. This ensures stock levels and XP-lock thresholds are never stale when a user lands on the store.

### D. Merch Product Detail (`/merch/[id]`)
- **Strategy**: Inherits from parent — Pure Dynamic SSR.

### E. Public Member Profiles (`/users/[id]`)
- **Strategy**: Pure Dynamic SSR (`dynamic = 'force-dynamic'`)
- **Behavior**: Profile data (XP, level, divisions, badges) and approved submissions are aggregated fresh on every request. Dynamic `generateMetadata` produces per-user OG tags and JSON-LD structured data (`schema.org/Person`).

### F. Private Profile (`/profile`)
- **Strategy**: Client-rendered (no `revalidate` export)
- **Behavior**: `ProfileClient` fetches the authenticated user's data via `/api/users/[id]` on mount. Always reflects the freshest state post-mutation.

### G. Apply Page (`/apply`)
- **Strategy**: Default — no `revalidate` export (fully dynamic server component or client fetch).

### H. Checkout (`/checkout`)
- **Strategy**: Client-rendered — payment and order state are always live.

### I. Admin Section (`/admin/*`)
- **Strategy**: Pure Dynamic SSR — all admin pages fetch live from the database. No caching at the page level.

### J. Auth Pages (`/login`, `/register`, `/forgot-password`, `/reset-password`)
- **Strategy**: Client-rendered — no SSR data dependency.

---

## 3. API Caching Layer

### `/api/stats`
- **Function**: `getGlobalStats()` in `lib/stats.ts`
- **Cache**: `unstable_cache` with a **3600-second (1-hour) window** and the `stats` tag
- **Reads**: `User` aggregate (total XP), `User.countDocuments()` (member count), `divisionstats` collection (precomputed per-division counts + leaders), and `submissions` collection (approved challenge count)
- **Tag Invalidation**: The `stats` tag is purged by `revalidateTag('stats')` on any mutation that affects global numbers

### `/api/stats` — Live Override via `getLiveStats()`
- Used internally to get fresh division counts without busting the full stats cache
- Re-reads `divisionstats` directly (no `unstable_cache`) while falling back to the cached member/XP aggregates for the heavy numbers

### `/api/realtime` (SSE)
- **Strategy**: Long-lived Server-Sent Events endpoint (`force-dynamic`)
- **Mechanism**: `subscribeToRealtimeUpdates()` / `publishRealtimeUpdate()` via a server-global subscriber map (`global.__bhlRealtimeState`)
- **Events**: `division-xp-update` — emitted after submission approval/revocation and division membership changes
- **Client Consumption**: `CommunityClient` and division stat components listen for these events to trigger local state refreshes without a full page reload

### `/api/twitch/live`
- **Strategy**: Dynamic, no cache
- **Behavior**: Proxies live stream status from Twitch API for BHL creator channels

### `/api/progression`
- **Strategy**: `force-dynamic`
- **Source**: `SystemSettings` → `levelProgression` array (admin-configurable XP thresholds)

### `/api/cron/youtube-sync`
- **Schedule**: Daily at `04:00 UTC` (Vercel Cron)
- **Auth**: `CRON_SECRET` header required
- **Behavior**: Calls `syncCreator()` for every public creator — refreshes `CreatorVideo` documents from YouTube Data API v3

---

## 4. Data Synchronization Workflow

The system uses a **Targeted Invalidation + Precomputed Stats** model:

```
User Action (join division / submit challenge)
    │
    ▼
API Route mutates MongoDB directly
    │
    ├─► syncDivisionStats(divId)          — updates DivisionStat document
    ├─► publishRealtimeUpdate(event)      — pushes SSE event to all open tabs
    └─► (on submission approve only)
        ├─► revalidateTag('stats')        — purges unstable_cache stats entry
        └─► revalidatePath('/', 'layout') — queues ISR refresh for home page
```

### Triggering Contexts
| Mutation | `syncDivisionStats` | `publishRealtimeUpdate` | `revalidateTag('stats')` |
| :--- | :---: | :---: | :---: |
| Join / Leave Division (`PATCH /api/users/[id]`) | ✅ | ✅ | ❌ |
| Submission Approved (`PATCH /api/admin/submissions/[id]`) | ✅ | ✅ | ✅ |
| Submission Revoked / Rejected | ✅ | ✅ | ❌ |

---

## 5. Rendering Strategy Reference Table

| Page / Route | Strategy | Revalidation | Notes |
| :--- | :--- | :--- | :--- |
| Home (`/`) | ISR | 60s | Stats + challenges passed as SSR props |
| Community (`/community`) | ISR (shell) | 60s | Data fetched client-side on mount |
| Merch (`/merch`) | Force Dynamic | Always fresh | Stock & XP-lock never stale |
| Public Profile (`/users/[id]`) | Force Dynamic | Always fresh | Per-user OG tags + JSON-LD |
| Private Profile (`/profile`) | Client-rendered | — | Auth-gated; fetches on mount |
| Checkout (`/checkout`) | Client-rendered | — | Live order state |
| Admin (`/admin/*`) | Dynamic SSR | Always fresh | Role-gated |
| `/api/stats` | `unstable_cache` | 3600s (`stats` tag) | Tag-purged on approval |
| `/api/realtime` | SSE (long-lived) | — | Push updates to open clients |
| `/api/progression` | Force Dynamic | — | Admin-configured level thresholds |
| `/api/cron/youtube-sync` | Cron (04:00 UTC) | Daily | Refreshes `CreatorVideo` documents |

---

## 6. Performance Impact & Scaling

### Database Load Reduction
| Pattern | Impact |
| :--- | :--- |
| ISR for Home & Community | ~85% reduction in DB hits for browsing traffic |
| Precomputed `DivisionStat` docs | Eliminates real-time aggregation on stat reads |
| `unstable_cache` on `getGlobalStats()` | 1-hour window absorbs burst traffic |
| SSE push vs. polling | Eliminates client polling loops for live updates |

### Expected Daily User Activity
| Action | Rendering Path | DB Impact |
| :--- | :--- | :--- |
| **Browsing Home** | ISR (60s) | Extremely Low |
| **Browsing Community** | ISR shell + client fetch | Low–Medium |
| **Viewing Merch** | Force Dynamic SSR | Medium |
| **Viewing Public Profile** | Force Dynamic SSR | Medium |
| **Checking Live Stats** | `unstable_cache` (3600s) | Very Low |
| **Submitting Challenge** | Direct API | Medium |
| **Admin Approving Submission** | Direct API + tag purge | Medium |

---

## 7. Hosting & Infrastructure

### A. Hosting: Vercel
- ISR + Edge Network: `revalidate` flags drive automatic cache refresh
- Cron Jobs: `vercel.json` schedules daily YouTube sync at `04:00 UTC`
- Environment: `CRON_SECRET`, `JWT_SECRET`, `MONGODB_URI`, `YOUTUBE_API_KEY`, `GMAIL_USER`, `GMAIL_PASS`, `NEXT_PUBLIC_SITE_URL`

### B. Database: MongoDB Atlas
- Precomputed `DivisionStat` collection absorbs the heaviest aggregation queries
- `SystemSettings` stores admin-configurable level progression and feature flags
- `CreatorVideo` acts as a YouTube data cache layer (refreshed daily via cron)

### C. Real-Time Layer
- SSE endpoint (`/api/realtime`) maintains open connections via a server-global subscriber map
- `publishRealtimeUpdate()` fans out `division-xp-update` events to all connected clients without polling

---

> [!NOTE]
> This hybrid architecture ensures the Brotherhood Legacy platform delivers cinematic load performance for all visitors while maintaining live competitive accuracy for leaderboards, divisions, and XP-driven commerce.
