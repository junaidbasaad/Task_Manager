#!/bin/sh
set -eu

# Docker Compose: http://api:4000
# Railway (private network): http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}
: "${PORT:=80}"
: "${API_UPSTREAM:=http://localhost:4000}"

export PORT API_UPSTREAM

echo "nginx listening on port ${PORT}"
echo "nginx proxy upstream: ${API_UPSTREAM}"

case "${API_UPSTREAM}" in
  *'${{'*)
    echo "ERROR: API_UPSTREAM still contains Railway template syntax — use Variable References, not a raw string."
    echo "  Example: http://\${{api.RAILWAY_PRIVATE_DOMAIN}}:\${{api.PORT}} via the References UI"
    exit 1
    ;;
esac

if ! curl -fsS --max-time 10 "${API_UPSTREAM}/api/health/ready" >/dev/null 2>&1; then
  echo "WARNING: cannot reach ${API_UPSTREAM}/api/health/ready from this container."
  echo "  Fix web API_UPSTREAM or enable private networking. Fallback: use the API public URL:"
  echo "  API_UPSTREAM=https://\${{YOUR_API_SERVICE.RAILWAY_PUBLIC_DOMAIN}}"
fi

envsubst '${PORT} ${API_UPSTREAM}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
