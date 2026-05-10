#!/usr/bin/env sh
set -eu

: "${PORT:=8080}"
export PORT

echo "Rendering nginx config for Cloud Run PORT=${PORT}"
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
