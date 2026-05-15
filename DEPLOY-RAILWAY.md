# Deploy Team Task Manager on Railway + GitHub

This guide deploys **three Railway resources** from one GitHub repo:

1. **PostgreSQL** (plugin)
2. **api** — Express backend (`backend/`)
3. **web** — React SPA + nginx (`frontend/`)

The web container proxies `/api` and `/uploads` to the API over Railway’s **private network**.

> **Monorepo — read this first**  
> If the build fails with *“no start script / no main / no index.js”*, Railpack is scanning the **repo root**.  
> You must set **Root Directory** per service and point to the config file:
>
> | Service | Root Directory | Config file path |
> |---------|----------------|------------------|
> | **api** | `backend` | `/backend/railway.toml` |
> | **web** | `frontend` | `/frontend/railway.toml` |
>
> Quick checklist: **[RAILWAY-DASHBOARD.md](./RAILWAY-DASHBOARD.md)**

---

## Part 1 — Push to GitHub

From your machine (replace `YOUR_USER` and repo name):

```bash
cd d:\junaid
git init
git add .
git commit -m "Initial commit: Team Task Manager"
git branch -M main
git remote add origin https://github.com/YOUR_USER/team-task-manager.git
git push -u origin main
```

`.env` files are gitignored. Never commit `backend/.env` or secrets.

---

## Part 2 — Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Select your repository.
3. **Add PostgreSQL**: Project → **+ New** → **Database** → **PostgreSQL**.

---

## Part 3 — API service

1. **+ New** → **GitHub Repo** → same repo (or **Add Service** if already linked).
2. **Settings** → **General**:
   - **Service name:** `api` (important for web service variables)
   - **Root Directory:** `backend` ← **required**
3. **Settings** → **Config file path:** `/backend/railway.toml`
4. **Settings** → **Build**: Builder should be **Dockerfile** (from config; not Railpack at repo root).
5. **Variables** (use **RAW** or **Reference** where noted):

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `TRUST_PROXY` | `1` |
| `JWT_EXPIRES_IN` | `7d` |
| `JWT_SECRET` | Generate 32+ chars: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `DATABASE_URL` | **Reference** → your Postgres service → `DATABASE_URL` |
| `CLIENT_URL` | Set **after** web deploys — your web public URL, e.g. `https://web-production-xxxx.up.railway.app` |
| `ALLOWED_ORIGINS` | Same as `CLIENT_URL` (comma-separate if you have multiple) |

6. **Settings** → **Networking** → **Generate Domain** (note the public API URL).
7. **Deploy**. Migrations run automatically (`prisma migrate deploy` in Dockerfile CMD).
8. **Optional — seed demo data** (once): **Settings** → run in shell or one-off:
   ```bash
   npm run db:seed
   ```
   Then change demo passwords in production.

9. **Optional — persistent uploads**: **Settings** → **Volumes** → mount path `/app/uploads`.

Health check path: `/api/health/ready`

---

## Part 4 — Web service

1. **+ New** → same GitHub repo.
2. **Settings** → **General**:
   - **Service name:** `web`
   - **Root Directory:** `frontend` ← **required**
3. **Settings** → **Config file path:** `/frontend/railway.toml`
4. **Variables**:

| Variable | Value |
|----------|--------|
| `API_UPSTREAM` | `http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}` |
| `VITE_API_URL` | *(leave empty)* — SPA uses same-origin `/api` via nginx |

> If your API service is **not** named `api`, replace `api` in the reference with your API service name.

5. **Settings** → **Networking** → **Generate Domain**.
6. Copy the **web** public URL and update **API** service:
   - `CLIENT_URL` = web URL (no trailing slash)
   - `ALLOWED_ORIGINS` = web URL
7. Redeploy **api** after CORS URLs are set.

Health check path: `/`

---

## Part 5 — Verify

1. Open the **web** URL → register or log in.
2. API health: `https://<api-domain>/api/health/ready` → `{ "ready": true }`.
3. If login fails with CORS errors, double-check `CLIENT_URL` / `ALLOWED_ORIGINS` match the **web** URL exactly (including `https`).

---

## Alternative: cross-origin frontend (no nginx proxy)

If you prefer the browser to call the API directly:

1. **Web** build variable: `VITE_API_URL=https://<api-public-domain>`
2. **API** `ALLOWED_ORIGINS` must include the web URL.
3. You can use a static host for `dist/` instead of the nginx Dockerfile (not required for the default setup).

---

## CI on GitHub

Every push/PR to `main` runs `.github/workflows/ci.yml` (lint, migrate, build). Railway deploys separately when connected to the repo.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API won’t start | Check `JWT_SECRET` length ≥ 32, `DATABASE_URL` linked, logs in Railway |
| 502 on `/api` from web | Confirm API service name is `api`, `API_UPSTREAM` uses private domain reference |
| CORS errors | `CLIENT_URL` / `ALLOWED_ORIGINS` = exact web URL |
| Uploads disappear | Add Railway volume at `/app/uploads` on API service |
| Migrations failed | Open API deploy logs; run `npx prisma migrate deploy` in Railway shell |

See also [railway.env.example](./railway.env.example) and [README.md](./README.md).
