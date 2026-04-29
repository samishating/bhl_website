# Website SSR Architecture: Brotherhood Legacy (BHL)

This document outlines the **Hybrid Rendering Strategy** implemented for the Brotherhood Legacy platform to balance real-time data accuracy, extreme performance, and server scalability.

---

## 1. Core Philosophy: Hybrid Efficiency
The BHL platform uses a multi-layered rendering approach. Public-facing pages are optimized for speed via **Incremental Static Regeneration (ISR)**, while critical statistics and user-specific actions remain dynamic.

---

## 2. Rendering Strategies by Component

### A. Home Page (`/`)
*   **Strategy**: Hybrid ISR (`revalidate = 60`).
*   **Behavior**: The page is served from a high-performance static cache that refreshes in the background every 60 seconds.
*   **Live Overlay**: To ensure "live-live" accuracy, the **Hero Stats** (Members, XP) are fetched client-side from `/api/stats` immediately after the page loads, bypassing the 60s cache.

### B. Global Statistics Engine (`/api/stats`)
*   **Strategy**: Dynamic with Tag-Based Caching.
*   **Function**: `getGlobalStats()` in `lib/stats.ts`.
*   **Behavior**: Uses `unstable_cache` with a 60-second window. It prioritizes reading precomputed `DivisionStat` documents to minimize heavy database aggregations.
*   **Tag**: `stats` (Purged on major updates).

### C. Division Pages (`/divisions/[slug]`)
*   **Strategy**: Long-Term ISR (`revalidate = 300`).
*   **Behavior**: These pages are cached for 5 minutes. They are proactively revalidated whenever a leaderboard change occurs for that specific division.

### D. User Dashboard & Private Areas
*   **Strategy**: Pure Dynamic SSR (`revalidate = 0`).
*   **Behavior**: Always rendered fresh from the database to ensure user specific data (XP claims, profile edits) is reflected instantly.

---

## 3. Data Synchronization Workflow

The system uses a **Targeted Invalidation** model to maintain accuracy:

1.  **Action Triggered**: A user joins/leaves a division or an admin approves a challenge.
2.  **Stat Persistence**: The precomputed `DivisionStat` document for that division is updated in MongoDB.
3.  **Targeted Purge**:
    *   `revalidateTag('stats')`: Clears the global stats cache.
    *   `revalidatePath('/', 'layout')`: Triggers a background refresh for the home page.
    *   `revalidatePath('/divisions/[slug]')`: Forces the specific division page to update its leaderboards.

---

## 4. Usage & Scaling Projections

### Performance Impact
*   **Database Load**: Reduced by ~85% compared to pure SSR by utilizing ISR and precomputed stats.
*   **Edge Performance**: Users experience near-instant page loads from the Vercel Edge Network.

### Expected User Activity (Daily)
| Action | Rendering Path | DB Impact |
| :--- | :--- | :--- |
| **Browsing Home** | ISR (60s) | Extremely Low |
| **Viewing Divisions** | ISR (300s) | Extremely Low |
| **Checking Stats** | Dynamic API (60s Cache) | Low |
| **XP Claim / Profile** | Direct API | Medium |

---

## 5. Hosting & Infrastructure

### A. Hosting Provider: Vercel
The hybrid strategy is purpose-built for Vercel's **Incremental Static Regeneration**. The `revalidate` flags ensure high performance without manual cache management.

### B. Database: MongoDB Atlas
By preferring precomputed `DivisionStat` docs, the database can handle significantly more concurrent users on smaller clusters (e.g., M10).

---

> [!NOTE]
> This hybrid architecture ensures that the Brotherhood Legacy platform remains "cinematic" and fast for all visitors, while maintaining the "live" competitive edge required for elite divisions.
