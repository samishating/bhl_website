# Brotherhood Legacy (BHL) — Official Platform

Brotherhood Legacy is a premier multi-division community platform designed for Gaming, Music, Sport, and Content creators. This platform integrates gamification, community management, and exclusive commerce into a unified experience for the Brotherhood.

## ⚔️ The Gamification System

BHL is built on a progression system where every action contributes to your legacy. Earn XP to climb the ranks, unlock exclusive content, and earn prestigious badges.

### How to Earn XP
| Action | XP Reward | Description |
| :--- | :--- | :--- |
| **Daily Login** | +10 XP | Stay active and consistent with the Brotherhood. |
| **Join Division** | +20 XP | Commit to a path: Gaming, Music, Sport, or Content. |
| **Submit Challenge** | +50-500 XP | Complete community challenges and provide proof. |

### 🏆 Ranks & Progression
There are **30 elite ranks** in the Brotherhood. Reaching higher levels unlocks exclusive features and store access.

| Level | Title | XP Required | Unlocks |
| :--- | :--- | :--- | :--- |
| 1 | **Recruit** | 0 XP | Basic platform access |
| 5 | **Member** | 1,000 XP | Forum posting permissions |
| 10 | **Warrior** | 7,500 XP | Division-specific challenges |
| 15 | **Legend** | 20,000 XP | **Ranked Badge** unlocked |
| 20 | **Guardian** | 32,500 XP | Priority challenge review |
| 23 | **Conqueror** | 40,000 XP | **Exclusive Drop Access** |
| 25 | **Immortal** | 44,000 XP | Squad recruitment access |
| 30 | **Eternal Legacy** | 50,000 XP | The Ultimate Recognition |

> [!IMPORTANT]
> **Conqueror Drops**: Exclusive merchandise and limited-edition gear are reserved for members with **40,000+ XP**.

---

## 🌎 Divisions
Choose your path and dominate your field:
- **🎮 Gaming**: Competitive play, scrims, and tournament domination.
- **🎵 Music**: Artist collaboration, track drops, and sound engineering.
- **💪 Sport**: Physical excellence, fitness challenges, and athletic growth.
- **🎬 Content**: Content creation, digital branding, and viral meta.

---

## 🛠️ Technology Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Vanilla CSS
- **Backend**: Node.js, MongoDB (Mongoose)
- **Authentication**: JWT-based secure sessions with Bcrypt hashing
- **Email Service**: Gmail SMTP via Nodemailer for secure password resets
- **Styling**: Premium "Rich Aesthetics" with Glassmorphism, Rajdhani typography, and scroll-reveal animations.

---

## 🛡️ Administrative Infrastructure
The platform includes a robust Admin Panel for community management:
- **Challenge Inbox**: Review and approve member submissions in real-time.
- **User Management**: Search, promote, or manage member profiles.
- **Product Management**: Multi-image support, stock tracking, and XP-locking for exclusive drops.
- **Division Control**: Manage division leads and community stats.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)
- Gmail Account (for SMTP)

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
   
   # Email (Gmail SMTP)
   GMAIL_USER=bhlsupportmail@gmail.com
   GMAIL_PASS=your_google_app_password
   
   # App URL
   NEXT_PUBLIC_APP_URL=https://brotherhoodlegacy.com
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 📡 Socials & Support
- **GitHub**: [bhl_website](https://github.com/samishating/bhl_website)
- **Discord**: [Join the Brotherhood](https://discord.gg/UJmwVv589E)

---
© 2026 Brotherhood Legacy. All rights reserved.
