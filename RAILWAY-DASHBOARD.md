# Railway settings for Task_Manager (monorepo)

Railway only **auto-detects** `railway.toml` or `railway.json` at the service root.  
This repo uses **`railway.api.toml`** and **`railway.web.toml`** — you must set the path in the dashboard.

---

## API service (backend)

### Step 1 — Config file path (required)

1. Open your **api** service → **Settings**.
2. Find **Config file path** / **Config as Code** (not Root Directory).
3. Set exactly:

   ```
   railway.api.toml
   ```

   If that fails, try:

   ```
   /railway.api.toml
   ```

4. Save.

This applies the **Dockerfile** builder (`Dockerfile.api`) and stops Railpack from using the repo-root `package.json` (which has no `start` script).

### Step 2 — Root Directory + config (must match)

| Option | Root Directory | Config file path | Dockerfile |
|--------|----------------|------------------|------------|
| **A — recommended** | `backend` | `/backend/railway.toml` or leave blank | `backend/Dockerfile` |
| **B** | *(empty — repo root)* | `railway.api.toml` | `Dockerfile.api` |

**Do not mix A and B.** If you see:

`failed to calculate checksum ... "/backend/src": not found`

you have **Root Directory = `backend`** but **Config = `railway.api.toml`**. Fix:

- Set **Config file path** → `/backend/railway.toml`  
  **or** clear Root Directory and use `railway.api.toml`

### Step 3 — Variables

See `railway.env.example` — at minimum: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `TRUST_PROXY=1`, and after web is live: `CLIENT_URL` + `ALLOWED_ORIGINS`.

### Step 4 — Redeploy

**Deployments** → **Redeploy**. Build logs should show **Dockerfile** build, not Railpack scanning root `package.json`.

---

## Web service (frontend) — separate service

1. **+ New** → same GitHub repo.
2. **Config file path** → `railway.web.toml`
3. **Root Directory** → `frontend` *(recommended)* OR repo root with `railway.web.toml`
4. **Service name** → `web`
5. `API_UPSTREAM` = `http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}`
6. Redeploy.

---

## Verify API deploy

- Build uses **Dockerfile.api** or **backend/Dockerfile**
- Logs: `prisma migrate deploy` then `API listening on port 4000`
- `GET /api/health/ready` → `{ "ready": true }`
