# Team Task Manager

Production-ready full-stack workspace for managing projects, team members, and tasks. The stack includes a **React + Vite + Tailwind CSS** frontend, a **Node.js + Express** API, **PostgreSQL**, and **Prisma ORM**, with **JWT** authentication, **bcrypt** password hashing, **role-based access control** (Admin / Member), analytics, activity logging, and a **drag-and-drop Kanban** board.

## Features

- **Authentication**: Register, login, logout, JWT stored in `localStorage`, `/api/auth/me`, profile update (name, password), profile image upload.
- **Roles**: **Admin** — full project CRUD, member management, task CRUD, assign tasks, view all tasks. **Member** — view only tasks assigned to them; update **status** on those tasks.
- **UI**: Responsive SaaS-style layout (sidebar + mobile nav), dashboard cards, data tables, modals, toasts (**react-hot-toast**), dark/light theme, loading states, and subtle motion (**framer-motion**). Charts with **Recharts**.
- **Tasks**: Search, filters, sorting, pagination, overdue highlighting, Kanban with **@hello-pangea/dnd**.
- **API**: REST, MVC-style folders, centralized errors, Zod validation, **Helmet**, **compression**, **Morgan**, CORS (see `CLIENT_URL` / `ALLOWED_ORIGINS`), **rate limits** on auth routes, **liveness/readiness** (`/api/health`, `/api/health/ready`), **graceful shutdown**, static `/uploads` for avatars.
- **Ops**: Prisma migrations + seed, **Docker** (non-root API container, hardened nginx for web), **GitHub Actions CI**, **Railway** configs, root script to run API + web together. See **`SECURITY.md`** for deployment checklist.

## Screenshots (placeholders)

Add your own images under `docs/screenshots/` and update the paths below.

| Area | Placeholder |
| --- | --- |
| Dashboard | ![Dashboard](docs/screenshots/dashboard.png) |
| Kanban | ![Kanban](docs/screenshots/kanban.png) |
| Tasks table | ![Tasks](docs/screenshots/tasks.png) |

## Prerequisites

- Node.js **20+**
- npm **10+**
- PostgreSQL **16+** (local install, or Docker — see below)

## Quick start (local)

### 1. Database

From the repository root:

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` with database `teamtaskmanager`, user/password `postgres` / `postgres` (see `docker-compose.yml`).

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env if your DATABASE_URL differs
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

The API listens on **http://localhost:4000** (`PORT` in `.env`).

- **Liveness**: `GET /api/health` — process is up.
- **Readiness**: `GET /api/health/ready` — returns **503** if the database is unreachable (use for orchestrators / Railway health checks).

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Default: VITE_API_URL=http://localhost:4000
# For local Vite dev with proxy, you can leave VITE_API_URL empty and rely on vite.config.ts proxies.
npm install
npm run dev
```

The app runs at **http://localhost:5173**.

### 4. Run API + web from the monorepo root

```bash
npm install          # installs concurrently at the repo root
npm run install:all
npm run dev
```

## Docker (full stack)

Build and run API + nginx-served SPA + Postgres:

```bash
docker compose -f docker-compose.full.yml up --build
```

- Web UI: **http://localhost:8080** (nginx proxies `/api` and `/uploads` to the API container).
- API direct: **http://localhost:4000**

The frontend image is built with `VITE_API_URL=""` so the browser uses same-origin `/api` through nginx.

## Prisma commands

| Command | Purpose |
| --- | --- |
| `npx prisma migrate dev` | Create/apply migrations in development |
| `npx prisma migrate deploy` | Apply migrations in production / CI |
| `npx prisma db seed` | Run `prisma/seed.js` |
| `npx prisma studio` | Open database GUI |

Seed credentials (change after first login in production):

- **Admin**: `admin@example.com` / `Password123!`
- **Member**: `member@example.com` / `Password123!`

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Use `production` in live environments (enforces stricter env validation). |
| `DATABASE_URL` | PostgreSQL connection string (**required** in production). |
| `JWT_SECRET` | Strong secret for signing JWTs (**required** in production, **≥ 32** characters, cannot be a known demo value). |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `PORT` | API port (default `4000`) |
| `CLIENT_URL` | Primary browser origin allowed to call the API (no trailing slash). |
| `ALLOWED_ORIGINS` | When set, **full** CORS allow-list (comma-separated, no spaces required). Include every browser origin that should call the API (e.g. `https://app.example.com,https://admin.example.com`). When unset, `CLIENT_URL` alone is used. |
| `TRUST_PROXY` | Set to `1` or `true` when the API sits behind a reverse proxy (correct client IP for logs / rate limits). |
| `MAX_FILE_SIZE_MB` | Avatar upload limit |

### Frontend (`frontend/.env`)

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL for API (e.g. `http://localhost:4000`). Empty string uses relative URLs (works with Vite proxy or nginx `/api`). |

## API overview

Base path: `/api`. Send `Authorization: Bearer <token>` for protected routes.

### Health

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness (no DB check) |
| `GET` | `/api/health/ready` | Readiness (DB ping; **503** if down) |

### Auth

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register (role `MEMBER`) |
| `POST` | `/api/auth/login` | Login, returns `{ user, token }` |
| `GET` | `/api/auth/me` | Current user |
| `PATCH` | `/api/auth/profile` | Update name / password |
| `POST` | `/api/auth/profile/image` | Multipart field `image` |

### Projects

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/api/projects` | Member: projects they belong to; Admin: all |
| `GET` | `/api/projects/:id` | Project access |
| `POST` | `/api/projects` | Admin |
| `PATCH` | `/api/projects/:id` | Admin |
| `DELETE` | `/api/projects/:id` | Admin |
| `POST` | `/api/projects/:id/members` | Admin — body `{ userId }` |
| `DELETE` | `/api/projects/:id/members/:userId` | Admin |

### Tasks

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/tasks` | Query: `projectId`, `search`, `status`, `priority`, `sortBy`, `sortOrder`, `page`, `pageSize` |
| `GET` | `/api/tasks/:id` | |
| `POST` | `/api/tasks` | Admin |
| `PATCH` | `/api/tasks/:id` | Admin: full fields; Member: **only** `status` on assigned tasks |
| `DELETE` | `/api/tasks/:id` | Admin |

### Dashboard & activity

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/dashboard/stats` | Aggregates for charts/cards |
| `GET` | `/api/dashboard/activity?limit=` | Activity log |

### Users (directory)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/users` | Admin — list users for assigning to projects |

## GitHub

See **[GITHUB.md](./GITHUB.md)** to init the repo, push to GitHub, and enable CI.

## Railway deployment

**Full step-by-step:** **[DEPLOY-RAILWAY.md](./DEPLOY-RAILWAY.md)**

Quick overview:

1. Push this repo to GitHub (see [GITHUB.md](./GITHUB.md)).
2. Railway → **New Project** → **Deploy from GitHub**.
3. Add **PostgreSQL**, then two services from the same repo:
   - **`api`** — Root Directory: `backend` (Dockerfile + `railway.toml`)
   - **`web`** — Root Directory: `frontend` (nginx proxies `/api` to the API via private network)
4. Copy variables from **[railway.env.example](./railway.env.example)** (generate `JWT_SECRET`, set `CLIENT_URL` to the web public URL).
5. Name the backend service **`api`** so the web service can use `API_UPSTREAM=http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}`.

Health checks: API **`/api/health/ready`**, web **`/`**.

## Continuous integration

On push / PR to `main` or `master`, **GitHub Actions** (`.github/workflows/ci.yml`) runs:

- **Backend**: `npm ci`, `prisma migrate deploy` against a service Postgres, `npm run lint`.
- **Frontend**: `npm ci`, `npm run build`.

## Project structure (high level)

```
backend/
  prisma/            # schema, migrations, seed
  src/
    config/          # env (Zod validation), prisma client
    controllers/
    middleware/      # auth, CORS, rate limits, errors, 404
    routes/          # includes health (liveness/readiness)
    services/        # activity helper
    utils/
    validators/      # Zod schemas
  eslint.config.js
.github/
  workflows/         # CI (lint, migrate, build)
frontend/
  public/            # robots.txt, manifest, favicon
  src/
    api/             # Axios client + service functions
    components/      # layout, UI, ErrorBoundary
    contexts/        # Auth + theme
    pages/
    routes/
```

## Security

See **[SECURITY.md](./SECURITY.md)** for reporting guidance and a production checklist.

## License

MIT (or your organization’s default — update as needed).
