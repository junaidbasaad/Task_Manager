# Security

## Reporting

If you discover a security vulnerability, please report it responsibly (private channel to your maintainers). Do not open a public issue for undisclosed vulnerabilities.

## Deployment checklist

- Use **HTTPS** everywhere in production.
- Set **`JWT_SECRET`** to a cryptographically random value (at least 32 characters). The API refuses weak/default secrets when `NODE_ENV=production`.
- Rotate database credentials and **never** commit real `.env` files.
- Set **`ALLOWED_ORIGINS`** (or **`CLIENT_URL`**) to the exact browser origins that should call the API.
- Enable **`TRUST_PROXY=1`** when the API sits behind a reverse proxy so rate limits and IP logging use the real client address.
- Run **`npx prisma migrate deploy`** in CI/CD before starting new instances.
- Keep dependencies updated (`npm audit`, Dependabot).

## Auth

- Passwords are hashed with **bcrypt** (cost factor 12).
- JWTs are signed with **HS256**; store tokens only where appropriate (this app uses `localStorage` for persistence — acceptable for many internal tools; for stricter threat models consider httpOnly cookies and CSRF protections).
