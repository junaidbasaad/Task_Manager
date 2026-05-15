# Railway deploy checklist (API + Web)

Use this before clicking **Redeploy**. Empty config path is OK when Root Directory is set.

## Step 0 — Add PostgreSQL (do this first)

Without this, the API **crashes on startup** during `prisma migrate deploy`.

1. Open your Railway **project** (canvas view).
2. Click **+ New** → **Database** → **PostgreSQL**.
3. Wait until Postgres shows as **Active**.
4. Click your **API** service → **Variables** tab.
5. Click **+ New Variable** → **Add Reference** (or **Reference Variable**).
6. Select the **PostgreSQL** service → choose **`DATABASE_URL`**.
7. Railway will show something like `${{Postgres.DATABASE_URL}}` — that is correct.
8. **Redeploy** the API service.

You should see `DATABASE_URL` listed under Variables (referenced from Postgres).

---

## API service

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Config file path | *(empty)* — auto-detects `railway.toml` |
| Builder | **Dockerfile** (from config) |

### Required variables

| Variable | How to set |
|----------|------------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `TRUST_PROXY` | `1` |
| `JWT_SECRET` | Random, **32+ characters** (not a demo value) |
| `DATABASE_URL` | **Reference** → PostgreSQL service → `DATABASE_URL` |

### After web is live

| Variable | Value |
|----------|--------|
| `CLIENT_URL` | `https://your-web.up.railway.app` |
| `ALLOWED_ORIGINS` | Same as `CLIENT_URL` |

### Success signals in logs

1. Docker build completes (Prisma generate, no `backend/src not found`)
2. `prisma migrate deploy`
3. `API listening on port 4000`
4. `GET /api/health/ready` → `"ready": true`

---

## Web service (second service)

| Setting | Value |
|---------|--------|
| Root Directory | `frontend` |
| Config file path | *(empty)* |
| Service name | `web` |

| Variable | Value |
|----------|--------|
| `API_UPSTREAM` | `http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}` |
| `VITE_API_URL` | *(empty)* |

---

## Common failures

| Error | Fix |
|-------|-----|
| `no start script` / Railpack on root | Root Directory must be `backend`, not empty |
| `/backend/src not found` | Don't use `railway.api.toml` with Root Directory `backend` |
| `Could not find Prisma Schema` | Fixed in Dockerfile — pull latest `main` |
| App crashes on start | Set `DATABASE_URL` + `JWT_SECRET` |
| CORS errors | Set `CLIENT_URL` / `ALLOWED_ORIGINS` to web URL |
