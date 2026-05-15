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

### Step 2 — Root Directory (pick one)

| Option | Root Directory | Config file | Dockerfile |
|--------|----------------|-------------|------------|
| **A — recommended** | `backend` | `/backend/railway.toml` *(auto-detected)* | `backend/Dockerfile` |
| **B — monorepo root** | *(empty)* or `/` | `railway.api.toml` | `Dockerfile.api` |

You currently use **Option B** if Root Directory is empty and Config path is `railway.api.toml`.

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
