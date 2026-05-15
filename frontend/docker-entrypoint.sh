#!/bin/sh
set -eu

# Docker Compose: http://api:4000
# Railway (private network): http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}
: "${API_UPSTREAM:=http://localhost:4000}"

export API_UPSTREAM

echo "nginx proxy upstream: ${API_UPSTREAM}"

envsubst '${API_UPSTREAM}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
