# FunStore — Full-Stack Social Platform

A social platform for sharing posts, photos and MCQ polls, built with a production-ready stack.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15.x · React 19.x · TypeScript 5.x · Tailwind CSS 4.x |
| **Backend** | NestJS 11.x · Node.js 24 LTS |
| **Database** | PostgreSQL 17 · Prisma ORM |
| **Cache** | Redis 8 · ioredis |
| **Background Jobs** | BullMQ + Redis |

## Quick Start

### 1. Clone & configure

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env` — change `JWT_SECRET` for production.

### 2. Start databases

```bash
docker compose up -d
```

Waits for PostgreSQL + Redis to be healthy.

### 3. Install & migrate

```bash
# Root (installs both workspaces)
npm install

# Run DB migrations + seed data
cd backend
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

### 4. Run the apps

```bash
# Both frontend + backend in parallel
npm run dev
```

| App | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Swagger Docs | http://localhost:3001/api/docs |

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@funstore.app | adminpass |
| User | priya@example.com | password |
| User | rafiul@example.com | password |
| User | tanvir@example.com | password |
| User | meherun@example.com | password |

## Project Structure

```
funstore-app/
├── docker-compose.yml          # PostgreSQL 17 + Redis 8
├── package.json                # Monorepo (npm workspaces)
│
├── backend/                    # NestJS 11 API
│   ├── prisma/
│   │   ├── schema.prisma       # DB schema
│   │   └── seed.ts             # Demo data
│   └── src/
│       ├── auth/               # JWT login/register
│       ├── posts/              # Feed, posts, polls, reactions, comments
│       ├── users/              # Profile, contacts
│       ├── admin/              # Dashboard, moderation, Content Studio
│       ├── queues/             # BullMQ notification + media jobs
│       ├── redis/              # Cache service
│       └── prisma/             # Prisma client wrapper
│
└── frontend/                   # Next.js 15 App Router
    └── src/
        ├── app/
        │   ├── page.tsx            # Login / Signup
        │   ├── feed/page.tsx       # Main feed
        │   ├── profile/page.tsx    # User profile
        │   └── admin/
        │       ├── login/page.tsx
        │       └── dashboard/page.tsx
        ├── components/
        │   ├── layout/         # Topbar, LeftNav, RightColumn
        │   ├── feed/           # PostCard, Composer
        │   └── poll/           # PollCard
        ├── hooks/useAuth.ts    # Zustand auth store
        ├── lib/api.ts          # Axios client
        └── types/index.ts      # TypeScript types
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Log in

### Posts (JWT required)
- `GET /api/posts/feed` — Paginated feed (Redis-cached)
- `POST /api/posts` — Create text/photo post
- `POST /api/posts/poll` — Create MCQ poll
- `POST /api/posts/:id/vote` — Vote on poll
- `POST /api/posts/:id/react` — React (LIKE/LOVE/HAHA/WOW/SAD)
- `POST /api/posts/:id/comments` — Add comment
- `GET /api/posts/:id/comments` — Get comments
- `POST /api/posts/:id/report` — Report post
- `DELETE /api/posts/:id` — Delete own post

### Users (JWT required)
- `GET /api/users/me` — My profile
- `GET /api/users/contacts` — Contacts list
- `GET /api/users/:handle` — Public profile
- `GET /api/users/:handle/posts` — User posts

### Admin (JWT + isAdmin required)
- `GET /api/admin/stats` — Dashboard stats
- `GET /api/admin/posts` — All posts
- `PATCH /api/admin/posts/:id/feature` — Toggle featured
- `DELETE /api/admin/posts/:id` — Delete any post
- `GET /api/admin/users` — All users
- `GET /api/admin/reports` — All reports
- `PATCH /api/admin/reports/:id` — Update report status
- `POST /api/admin/studio/publish` — Publish featured post

## Features

- **Authentication** — JWT with 7-day expiry, bcrypt password hashing
- **Feed** — Paginated, Redis-cached first page (30s TTL)
- **Posts** — Text, image URL, explanation notes
- **Polls** — MCQ with correct answer reveal + explanation after voting
- **Reactions** — 5 reaction types (LIKE, LOVE, HAHA, WOW, SAD), toggle
- **Comments** — Real-time loaded on demand
- **Reports** — User reporting with admin moderation queue
- **Admin Panel** — Stats dashboard, post moderation, user list, Content Studio
- **Background Jobs** — BullMQ for notification + media processing queues
- **Design System** — Fredoka + Inter + JetBrains Mono · violet/coral palette
