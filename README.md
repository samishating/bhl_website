# Brotherhood Legacy (BHL) — Official Platform

Brotherhood Legacy is a high-fidelity, community-driven ecosystem designed for elite **Gaming**, **Music**, **Sport**, and **Content** creators. This platform fuses cinematic aesthetics with deep gamification, community automation, and exclusive commerce.

---

## ⚔️ The Gamification System

BHL operates on a 100% organic, XP-driven meritocracy. Every contribution to the Brotherhood is tracked, calculated, and converted into status.

### How to Earn XP
| Action | XP Reward | Description |
| :--- | :--- | :--- |
| **Daily Login** | +10 XP | Stay active and consistent with the Brotherhood. |
| **Join Division** | +20 XP | Commit to a path: Gaming, Music, Sport, or Content. |
| **Submit Challenge** | +50-500 XP | Complete community challenges and provide proof. |

### 🏆 Ranks & Progression
The Brotherhood recognizes **30 elite ranks**. Progression is dynamic, powered by the core `lib/xp.ts` engine.

| Level | Title | XP Required | Milestone |
| :--- | :--- | :--- | :--- |
| 1 | **Recruit** | 0 XP | Initial entry into the Brotherhood |
| 5 | **Member** | 1,000 XP | **Ranked Badge** unlocked |
| 15 | **Legend** | 20,000 XP | **Veteran Status** achieved |
| 23 | **Conqueror** | 40,000 XP | **Exclusive Drop Access** (Merch Lock) |
| 25 | **Immortal** | 44,000 XP | Elite circle membership |
| 30 | **Eternal Legacy** | 50,000 XP | The Ultimate Ascension |

> [!IMPORTANT]
> **Conqueror Drops**: Premium merchandise and limited-edition releases are strictly reserved for members who have achieved **Conqueror status (40,000+ XP)**.

---

## 🌎 Divisions
Choose your path and dominate your field:
- **🎮 Gaming**: Competitive play, scrims, and tournament domination.
- **🎵 Music**: Artist collaboration, track drops, and sound engineering.
- **💪 Sport**: Physical excellence, fitness challenges, and athletic growth.
- **🎬 Content**: Content creation, digital branding, and viral strategy.

---

## 📡 Community & Creator Sync
BHL features an automated content pipeline that keeps the community page alive and dynamic.
- **YouTube Sync Engine**: Server-side sync pipeline (`/api/admin/youtube/sync`) that caches creator content.
- **Auto-Cycling Carousels**: High-fidelity creator video showcases that auto-cycle based on community ranking.
- **Organic Ranking**: The Community Directory and Leaderboards are automatically sorted by XP, ensuring the most active members are always featured.

---

## 🛠️ Technology Stack
- **Framework**: Next.js 15+ (App Router, Server Components)
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose) with optimized indexing for rankings
- **Automation**: Vercel Cron Jobs for daily creator synchronization
- **Authentication**: JWT-based secure sessions
- **UI/UX**: Vanilla CSS with custom design tokens, Glassmorphism, and the signature **BHL Square Avatar** standard.

---

## 🛡️ Administrative Infrastructure
A comprehensive command center for platform oversight:
- **Personnel Progression**: High-density dashboard for managing member XP, levels, and division assignments.
- **Product Management**: 2-column wide layout for managing merchandise, stock levels, and XP-locks.
- **Submission Pipeline**: Real-time review system for community challenges.
- **Sync Control**: Manual triggers for YouTube content synchronization.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)
- YouTube Data API v3 Key (for creator sync)
- Gmail Account (for SMTP transactional emails)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/samishating/bhl_website.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (`.env.local`):
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # Security
   JWT_SECRET=your_secure_secret
   CRON_SECRET=your_vercel_cron_secret
   
   # APIs
   YOUTUBE_API_KEY=your_youtube_api_key
   
   # Email (Gmail SMTP)
   GMAIL_USER=bhlsupportmail@gmail.com
   GMAIL_PASS=your_google_app_password
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🛡️ Development Standards (For Agents & Contributors)
- **Aesthetics**: Follow the 8px spacing system and use `var(--radius-md)` (12px) for consistency.
- **Avatars**: All profile images **MUST** be square/squircle. Never use circular `border-radius: 50%`.
- **Ranking**: Never use manual order fields. Always sort by `xp: -1`.

---

© 2026 Brotherhood Legacy. All rights reserved.


