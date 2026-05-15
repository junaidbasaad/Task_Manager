# GitHub setup

## Prerequisites

- [Git](https://git-scm.com/)
- [GitHub](https://github.com) account
- Optional: [GitHub CLI](https://cli.github.com/) (`gh`)

## First-time push

```bash
cd d:\junaid
git init
git add .
git status   # confirm .env files are NOT listed
git commit -m "Initial commit: Team Task Manager"
git branch -M main
```

Create the remote repo on GitHub (website: **New repository**, no README if you already have one locally), then:

```bash
git remote add origin https://github.com/YOUR_USER/team-task-manager.git
git push -u origin main
```

### Using GitHub CLI

```bash
gh auth login
gh repo create team-task-manager --public --source=. --remote=origin --push
```

## What gets committed

- Application source, Dockerfiles, Prisma migrations, CI workflow
- **Not** committed (see `.gitignore`): `node_modules/`, `dist/`, `.env`, `backend/uploads/`

## CI

On every push/PR to `main` or `master`, GitHub Actions runs:

- Backend: install, `prisma migrate deploy`, ESLint
- Frontend: install, production build

## Connect Railway

After the repo is on GitHub:

1. Railway → **New Project** → **Deploy from GitHub repo**
2. Select this repository
3. Follow **[DEPLOY-RAILWAY.md](./DEPLOY-RAILWAY.md)**

## Branch protection (recommended)

On GitHub → **Settings** → **Branches** → add rule for `main`:

- Require status checks: `backend`, `frontend` (from CI workflow)
- Require pull request reviews before merge (optional)
