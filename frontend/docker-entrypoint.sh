#!/bin/sh
set -eu

# Docker Compose: http://api:4000
# Railway (private network): http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}
: "${PORT:=80}"

export PORT

if [ -z "${API_UPSTREAM:-}" ]; then
  echo "ERROR: API_UPSTREAM is not set."
  echo "  Railway web service → Variables → add API_UPSTREAM via Reference to your API service:"
  echo "  http://\${{api.RAILWAY_PRIVATE_DOMAIN}}:\${{api.PORT}}"
  echo "  Or public fallback: https://\${{api.RAILWAY_PUBLIC_DOMAIN}}"
  exit 1
fi

export API_UPSTREAM

echo "nginx listening on port ${PORT}"
echo "nginx proxy upstream: ${API_UPSTREAM}"

case "${API_UPSTREAM}" in
  *'${{'*)
    echo "ERROR: API_UPSTREAM still contains Railway template syntax — use Variable References, not a raw string."
    exit 1
    ;;
  http://localhost:*|http://127.0.0.1:*|http://[::1]:*)
    if [ -n "${RAILWAY_ENVIRONMENT:-}${RAILWAY_PROJECT_ID:-}" ]; then
      echo "ERROR: API_UPSTREAM points at localhost (${API_UPSTREAM}). The API runs in a different container."
      echo "  Set API_UPSTREAM to your API service (private or public URL) and redeploy."
      exit 1
    fi
    ;;
esac

if ! curl -fsS --max-time 10 "${API_UPSTREAM}/api/health/ready" >/dev/null 2>&1; then
  echo "WARNING: cannot reach ${API_UPSTREAM}/api/health/ready from this container."
  echo "  Fix web API_UPSTREAM or enable private networking. Fallback: use the API public URL:"
  echo "  API_UPSTREAM=https://\${{YOUR_API_SERVICE.RAILWAY_PUBLIC_DOMAIN}}"
fi

envsubst '${PORT} ${API_UPSTREAM}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
