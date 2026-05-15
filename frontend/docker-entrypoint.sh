#!/bin/sh
set -eu

# Docker Compose: http://api:4000
# Railway (private network): http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}
: "${PORT:=80}"
: "${API_UPSTREAM:=http://localhost:4000}"

export PORT API_UPSTREAM

echo "nginx listening on port ${PORT}"
echo "nginx proxy upstream: ${API_UPSTREAM}"

envsubst '${PORT} ${API_UPSTREAM}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
