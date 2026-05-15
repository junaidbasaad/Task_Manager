# Railway: set Root Directory (required for monorepo)

Railway **does not** read `backend/railway.toml` until **Root Directory** is set in the dashboard. That setting **cannot** be committed to Git — you set it once per service.

## API service — set Root Directory to `backend`

1. Open [Railway Dashboard](https://railway.app/dashboard).
2. Open your project → click the **api** service (backend).
3. Go to **Settings**.
4. Under **Source** (or **General**), find **Root Directory**.
5. Enter exactly:

   ```
   backend
   ```

   (no leading slash)

6. Under **Config file path** (Config as Code), enter:

   ```
   /backend/railway.toml
   ```

7. Click **Save** / wait for settings to apply.
8. **Deployments** → **Redeploy** (or push a new commit).

You should see the builder use **Dockerfile** from `backend/`, not Railpack scanning the repo root.

## Web service — set Root Directory to `frontend`

Create a **second** service if you only have one:

1. **+ New** → **GitHub Repo** → same `Task_Manager` repo.
2. **Settings** → **Root Directory** → `frontend`
3. **Config file path** → `/frontend/railway.toml`
4. **Service name** → `web`
5. Variable: `API_UPSTREAM` = `http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}`
6. Redeploy.

## Fallback (if Root Directory field is missing)

Use repo-root Dockerfiles instead of subdirectory roots:

| Service | Config file path | Dockerfile used |
|---------|------------------|-----------------|
| API | `/railway.api.toml` | `Dockerfile.api` |
| Web | `/railway.web.toml` | `Dockerfile.web` |

Still set **two separate services**; do not run both from one service.

## Verify

After deploy, API logs should show Prisma migrate + `API listening on port 4000`.  
Health: `https://<api-domain>/api/health/ready` → `"ready": true`.
