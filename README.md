# SkillBound — Peer-to-Peer Skill Exchange Platform

SkillBound is a full-stack, reciprocal 1-for-1 peer skill exchange web application built for university students and campus communities. Users list skills they can teach and skills they want to acquire, get matched using a transparent rule-based compatibility engine, exchange learning requests, schedule study sessions, chat in real time, rate completed sessions, and earn contribution points and badges.

## Key Features

- **Authentication & Security**: Registration with optional avatar upload, login, logout, forgot/reset password flow, `bcryptjs` password hashing, JWT session persistence, and role-protected routes (`student` & `admin`).
- **Profile & Skill Management**: Editable campus profile, profile completion tracker, avatar upload via `multer`, and full CRUD for skills across 10 categories (`Programming`, `Web Development`, `Graphic Design`, `Photography`, `Communication`, `Marketing`, `Business`, `Music`, `Languages`, `Personal Development`).
- **Skill Discovery & Smart Rule-Based Matching**: Filter peers by keyword, category, proficiency level, campus location, or mutual matches only. Transparent rule-based matching compares User A's teachable skills with User B's learning goals and vice versa, generating match percentages and clear explanations.
- **Learning Requests & Session Scheduling**: Send, accept, decline, or cancel pending requests; schedule sessions from accepted swaps; reschedule, cancel, or mark sessions completed.
- **Real-Time Messaging**: Persistent conversation history backed by SQLite + live Socket.IO rooms for instant peer-to-peer messages.
- **Ratings, Reviews & Gamification**: 1–5 star ratings with impression tags and duplicate-review prevention per session. Idempotent points engine (`+50` learn session, `+30` teach session, `+10` positive review, `+20` complete profile), achievement badges, tiers, and campus leaderboard.
- **Admin Moderation Dashboard**: Role-protected overview of registered students, sessions, requests, flagged accounts, and account moderation controls (suspend, reactivate, clear report, delete).

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, React Router, Lucide Icons, Socket.IO Client
- **Backend**: Node.js, Express 4, Socket.IO, JWT (`jsonwebtoken`), `bcryptjs`, `multer`
- **Database**: SQLite (`better-sqlite3`) persisted to `./data/skillbound.db` with normalized tables and foreign keys

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env` if running outside AI Studio:
   ```env
   PORT=3000
   JWT_SECRET=your_secret_key
   SQLITE_DB_PATH=./data/skillbound.db
   ```

3. **Run in development**
   ```bash
   npm run dev
   ```
   The Express + Vite middleware server runs on `http://localhost:3000` and automatically initializes & seeds the SQLite database on first boot.

4. **Build and run in production**
   ```bash
   npm run build
   npm start
   ```

## Demo Login Credentials

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Student | `maya.lin@columbia.edu` | `SkillBound2025` | Teaches UI/UX & Figma; wants Python & Photography |
| Mutual Match Peer | `alex.patel@columbia.edu` | `SkillBound2025` | Teaches Python & Algorithms; wants UI/UX & Figma |
| Admin | `admin@skillbound.edu` | `AdminSkill2025` | Full access to `/admin` moderation dashboard |

## REST API Reference (`/api/*`)

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- **Dashboard & Notifications**: `GET /api/dashboard`, `GET /api/notifications`, `POST /api/notifications/read`
- **Users & Peers**: `PUT /api/users/profile`, `POST /api/users/avatar`, `GET /api/peers/:id`, `POST /api/peers/:id/report`
- **Skills & Discovery**: `GET /api/skills/my`, `POST /api/skills`, `PUT /api/skills/:id`, `DELETE /api/skills/:id`, `GET /api/discover`
- **Requests**: `GET /api/requests`, `POST /api/requests`, `PATCH /api/requests/:id`
- **Sessions**: `GET /api/sessions`, `POST /api/sessions`, `PATCH /api/sessions/:id`
- **Messages**: `GET /api/conversations`, `POST /api/conversations`, `GET /api/conversations/:conversationId/messages`, `POST /api/conversations/:conversationId/messages`
- **Reviews**: `POST /api/reviews`, `GET /api/reviews/user/:userId`
- **Rewards**: `GET /api/rewards`
- **Admin**: `GET /api/admin/overview`, `PATCH /api/admin/users/:id`, `DELETE /api/admin/users/:id`
