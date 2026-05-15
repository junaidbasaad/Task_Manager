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

case "${API_UPSTREAM}" in
  http://*|https://*) ;;
  *)
    API_UPSTREAM="https://${API_UPSTREAM}"
    export API_UPSTREAM
    echo "NOTE: API_UPSTREAM missing scheme — using ${API_UPSTREAM}"
    ;;
esac

echo "nginx listening on port ${PORT}"
echo "nginx proxy upstream: ${API_UPSTREAM}"

case "${API_UPSTREAM}" in
  *'${{'*|http://:|https://:)
    echo "ERROR: API_UPSTREAM is invalid (${API_UPSTREAM})."
    echo "  Private refs did not resolve. On Railway web → Variables, either:"
    echo "  1) Re-add API_UPSTREAM using the Reference UI (not typed \${{...}}), or"
    echo "  2) Set API_UPSTREAM=https://YOUR-API-PUBLIC-DOMAIN.up.railway.app"
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

API_UPSTREAM_HOST=$(echo "$API_UPSTREAM" | sed -e 's|^[a-zA-Z]*://||' -e 's|/.*||' -e 's|:.*||')
export API_UPSTREAM_HOST
echo "nginx upstream host header: ${API_UPSTREAM_HOST}"

if ! curl -fsS --max-time 10 "${API_UPSTREAM}/api/health/ready" >/dev/null 2>&1; then
  echo "WARNING: cannot reach ${API_UPSTREAM}/api/health/ready from this container."
  echo "  Try private: http://<api-service>.railway.internal:4000"
fi

envsubst '${PORT} ${API_UPSTREAM} ${API_UPSTREAM_HOST}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
