# FamTree

A production-ready Next.js web application for creating, managing, and sharing **private family trees**.

## Overview

FamTree is a secure, collaborative platform where users can:
- Create and manage private family trees
- Invite relatives to collaborate with role-based permissions
- View, add, edit, and organize people and relationships
- Clone/branch a tree into a private copy
- Propose links between separate family trees
- Export trees as JSON (PDF/PNG via background jobs)
- Track activity and revision history
- Control visibility for living persons

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Theme | next-themes (light/dark) |
| Auth | Auth.js (NextAuth) v5 |
| OAuth | Google, Facebook |
| Email | Resend (magic link) |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Validation | Zod |
| Testing | Vitest + Playwright |
| Containers | Docker |

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ or Docker

### 1. Clone and install

```bash
git clone https://github.com/sharf-shawon/FamTree
cd FamTree
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — Random secret (generate with `openssl rand -base64 32`)

Optional (for OAuth/email):
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET`
- `RESEND_API_KEY` / `EMAIL_FROM`

### 3. Database setup

```bash
npm run db:push      # Apply schema to database (development)
# OR
npm run db:migrate   # Run migrations (production-style)
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Docker

```bash
# Start with Docker Compose (includes PostgreSQL)
docker-compose up

# App runs on http://localhost:3000
# DB runs on localhost:5432
```

---

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── (root)/            # Landing page
│   ├── auth/              # Auth pages (signin, verify, error)
│   ├── dashboard/         # User dashboard
│   ├── trees/             # Tree list & create
│   │   └── [treeId]/      # Tree detail (visualization, people, members, activity)
│   ├── invite/[token]/    # Invite acceptance
│   └── api/               # API routes
│       ├── auth/          # NextAuth endpoints
│       ├── trees/         # Tree CRUD
│       │   └── [treeId]/  # Tree-scoped APIs
│       │       ├── people/
│       │       ├── relationships/
│       │       ├── invitations/
│       │       ├── branch/
│       │       ├── export/
│       │       └── activity/
│       ├── invite/[token]/ # Public invite endpoints
│       └── health/        # Health check
├── components/
│   ├── ui/                # shadcn-style UI primitives
│   ├── layout/            # AppShell, Sidebar
│   ├── visualization/     # Tree SVG canvas
│   └── providers.tsx      # Session + Theme providers
├── lib/
│   ├── auth/              # Auth.js configuration
│   ├── db/                # Prisma client
│   ├── permissions/       # Role checks, access guards
│   ├── validations.ts     # Zod schemas
│   ├── activity/          # Activity log helpers
│   ├── email/             # Email templates
│   ├── exports/           # Export job logic
│   └── utils.ts           # Shared utilities
├── tests/                 # Unit tests (Vitest)
└── types.ts               # Shared types and role permissions
```

---

## Permission Model

| Action | OWNER | EDITOR | CONTRIBUTOR | VIEWER |
|--------|-------|--------|-------------|--------|
| Read tree | ✅ | ✅ | ✅ | ✅ |
| Export | ✅ | ✅ | ✅ | ✅ |
| Branch/fork | ✅ | ✅ | ✅ | ✅ |
| Add/edit people | ✅ | ✅ | ✅ | ❌ |
| Delete people | ✅ | ✅ | ❌ | ❌ |
| Invite members | ✅ | ❌ | ❌ | ❌ |
| Manage members | ✅ | ❌ | ❌ | ❌ |
| Delete tree | ✅ | ❌ | ❌ | ❌ |

All permission checks are enforced **server-side** in API route handlers.

---

## Data Model

Key entities:
- **FamilyTree** — Private by default. Supports branching (parentTreeId).
- **Person** — Soft-deletable. Supports living flag, visibility controls, aliases.
- **Relationship** — Graph edges. Types: PARENT_CHILD, PARTNER, SIBLING. Subtypes: BIOLOGICAL, ADOPTIVE, STEP, FOSTER, MARRIED, DIVORCED, etc.
- **TreeMembership** — Links users to trees with a role.
- **Invitation** — Token-based invite with expiry.
- **ActivityLog** — Audit trail for all mutations.
- **ExportJob** — Async export queue (PDF/PNG).
- **TreeLink** — Cross-tree link proposals.

---

## Security

- **Deny-by-default**: Every API route checks session and membership before acting.
- **Server-side validation**: All mutations validated with Zod before hitting the DB.
- **CSRF**: Next.js built-in CSRF protection; Auth.js handles token security.
- **Rate limiting**: Applied to `/api/auth`, `/api/trees/*/invitations`, and export endpoints.
- **Open redirect protection**: Auth.js `callbackUrl` is validated against `NEXTAUTH_URL`.
- **Audit logging**: All destructive actions and permission changes are logged.
- **Privacy defaults**: All trees are private by default; living person details can be hidden.

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run typecheck    # TypeScript type check
npm run lint         # ESLint
npm run test         # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run db:generate  # Regenerate Prisma client
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

---

## Testing

```bash
# Unit tests
npm run test

# E2E tests (requires running app + DB)
npm run test:e2e
```

Unit tests cover:
- Permission role hierarchy
- Zod validation schemas
- Role-based action checks

E2E tests cover (Playwright):
- Sign in flow
- Create tree
- Add person
- Invite member
- Branch tree
- Export tree

---

## Health Check

```
GET /api/health
```

Returns `{ "status": "ok", "timestamp": "..." }` (200) or `{ "status": "error" }` (503).

---

## Production Deployment

1. Set all environment variables (see `.env.example`)
2. Run database migrations: `npm run db:migrate`
3. Build the app: `npm run build`
4. Start: `npm run start` or use Docker

See `Dockerfile` and `docker-compose.yml` for container deployment.
