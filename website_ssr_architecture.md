# Website SSR Architecture: Brotherhood Legacy (BHL)

This document outlines the Server-Side Rendering (SSR) architecture implemented for the Brotherhood Legacy platform to ensure real-time data accuracy and high performance.

## 1. Core Philosophy: Real-Time Accuracy
The BHL platform prioritizes **Live Synchronization**. Unlike standard static websites, BHL ensures that whenever a user joins a division, earns XP, or a database modification occurs, the changes are reflected instantly for all users. This is achieved by bypassing static caches in favor of pure SSR for critical components.

---

## 2. SSR Implementation Details

### A. Home Page (`/`)
*   **Strategy**: Pure SSR (`revalidate = 0`).
*   **Behavior**: Every visitor to the home page triggers a server-side render that fetches the latest leaderboard, total XP, and division member counts directly from MongoDB.
*   **Files**: `app/(main)/page.tsx`

### B. Global Statistics Engine
*   **Strategy**: Direct Database Fetch (No Cache).
*   **Function**: `getGlobalStats()` in `lib/stats.ts`.
*   **Behavior**: Aggregates total members, total XP, and division leaders across the entire DB. This function was recently decoupled from `unstable_cache` to guarantee zero-latency updates.
*   **API Endpoint**: `/api/stats` (Forced Dynamic).

### C. Division Pages (`/divisions/[slug]`)
*   **Strategy**: Incremental Static Regeneration (ISR) with fallback.
*   **Revalidation**: Currently set to 1 hour, but easily adjustable to 0 for pure SSR if needed.
*   **Files**: `app/divisions/[slug]/page.tsx`

---

## 3. Data Synchronization Workflow

The system uses a **Proactive Sync** model. Instead of waiting for a user to visit a page, the backend forces updates when relevant actions occur:

1.  **Action Triggered**: A user joins/leaves a division or claims XP.
2.  **Stat Recalculation**: `syncDivisionStats(divisionId)` is called.
3.  **Persistence**: The `DivisionStat` collection in MongoDB is updated with new leader data and counts.
4.  **Cache Purge**: `revalidatePath('/', 'layout')` is called to ensure the next request gets the absolute latest HTML.

---

## 4. Usage & Performance Projections

### Estimated Daily Activity (Per User)
| Action | Frequency | Impact |
| :--- | :--- | :--- |
| **Page Load (Home)** | 3-5 times | High (Triggers SSR) |
| **XP Claim (Daily)** | 1 time | Medium (Triggers Sync) |
| **Division Toggle** | 0.5 times | High (Triggers Full Leaderboard Re-sync) |
| **Challenge Submission**| 1-2 times | Low (Initial), High (On Admin Approval) |

### System Load Projection
*   **Reads**: 1 DB hit per home page load (aggregated).
*   **Writes**: 2-3 DB hits per active session (XP/Sync).
*   **Target**: Optimized for up to 10,000 concurrent users with a standard M10 Atlas Cluster.

---

## 5. Hosting & Infrastructure Recommendations

### A. Hosting Provider: Vercel (Recommended)
*   **Reason**: Native support for Next.js SSR and ISR.
*   **Optimization**: Use **Serverless Functions** for the API and SSR pages. The `revalidate = 0` configuration ensures Vercel never serves stale content.

### B. Database: MongoDB Atlas
*   **Configuration**: M10 or higher.
*   **Scaling**: Enable **Auto-Scaling** to handle spikes during large tournament events or new division launches.

### C. Performance Tip: Connection Pooling
Ensure `connectDB` in `lib/db.ts` uses a singleton pattern (already implemented) to prevent exhausting DB connections during high SSR traffic.

---

## 6. Summary for Hosting Planning
*   **Bandwidth**: Moderate (Cinematic assets are optimized).
*   **Compute**: High (Heavy reliance on SSR for real-time feel).
*   **Storage**: Low (MongoDB stores metadata, assets are in Public/Cloud).

> [!IMPORTANT]
> Because the site is now "Pure SSR," you do not need to worry about manually purging caches when the database updates. The system handles this automatically at the architectural level.
