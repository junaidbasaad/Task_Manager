# Railway dashboard checklist (monorepo)

Railway **cannot** deploy this repo from the root alone. You need **two services** + **Postgres**.

## Fix: “Railpack scanning repo root / no start script”

That error means **Root Directory** is empty or wrong. Set it per service:

| Service | Root Directory | Config file path |
|---------|----------------|------------------|
| **api** (backend) | `backend` | `/backend/railway.toml` |
| **web** (frontend) | `frontend` | `/frontend/railway.toml` |

### API service (`api`)

1. Open the **api** service → **Settings**.
2. **Source** → **Root Directory** → `backend` → **Save**.
3. **Config file** (or **Config as Code**) → path: `/backend/railway.toml`.
4. **Build** → Builder should show **Dockerfile** (from config). If it still says Railpack at repo root, redeploy after saving Root Directory.
5. **Variables** — see `railway.env.example`.

### Web service (`web`)

1. New service from same repo (or duplicate settings).
2. **Root Directory** → `frontend`.
3. **Config file path** → `/frontend/railway.toml`.
4. **Variables:**
   - `API_UPSTREAM` = `http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}`
   - `VITE_API_URL` = *(leave empty)*

### After web gets a public URL

On **api**, set:

- `CLIENT_URL` = your web URL (no trailing slash)
- `ALLOWED_ORIGINS` = same URL  

Redeploy **api**.

---

Full guide: **[DEPLOY-RAILWAY.md](./DEPLOY-RAILWAY.md)**
