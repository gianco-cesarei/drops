#!/bin/sh
set -eu

image_name="${DROPS_SMOKE_IMAGE:-drops-web-api:smoke}"
web_image_name="${DROPS_SMOKE_WEB_IMAGE:-drops-web-static:smoke}"
container_name="drops-web-smoke-$$"
volume_name="drops-web-smoke-$$"
host_port="${DROPS_SMOKE_PORT:-18000}"
container_port=18080
frontend_origin="http://localhost:4321"
bundle_api_url="https://api.smoke.invalid"
temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/drops-web-smoke.XXXXXX")"
cookie_file="$temp_dir/cookies.txt"

cleanup() {
  docker rm -f "$container_name" >/dev/null 2>&1 || true
  docker volume rm "$volume_name" >/dev/null 2>&1 || true
  rm -rf "$temp_dir"
}
trap cleanup EXIT INT TERM

docker build \
  --target web-build \
  --build-arg "PUBLIC_API_URL=$bundle_api_url" \
  -t "$web_image_name" .
docker run --rm "$web_image_name" \
  grep -R --fixed-strings --quiet "$bundle_api_url" /web/dist

docker build --target api -t "$image_name" .
password_hash="$(docker run --rm "$image_name" python -c 'from argon2 import PasswordHasher; print(PasswordHasher().hash("smoke-password"))')"
docker volume create "$volume_name" >/dev/null

docker run -d \
  --name "$container_name" \
  -p "127.0.0.1:${host_port}:${container_port}" \
  -v "$volume_name:/data" \
  -e "PORT=$container_port" \
  -e DROPS_WEB_USERNAME=smoke \
  -e "DROPS_WEB_PASSWORD_HASH=$password_hash" \
  -e "DROPS_WEB_ALLOWED_ORIGINS=$frontend_origin" \
  -e DROPS_WEB_COOKIE_SECURE=false \
  -e DROPS_WEB_ENV=development \
  "$image_name" >/dev/null

attempt=0
until curl --fail --silent "http://127.0.0.1:${host_port}/health" >/dev/null; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    docker logs "$container_name"
    exit 1
  fi
  sleep 1
done

curl --fail --silent \
  -c "$cookie_file" \
  -H "Origin: $frontend_origin" \
  -H "Content-Type: application/json" \
  --data '{"username":"smoke","password":"smoke-password"}' \
  "http://127.0.0.1:${host_port}/api/v1/auth/login" >/dev/null

curl --fail --silent \
  -b "$cookie_file" \
  -H "Origin: $frontend_origin" \
  "http://127.0.0.1:${host_port}/api/v1/auth/me" >/dev/null

docker exec "$container_name" test -f /data/web.sqlite3
docker exec "$container_name" test -d /data/jobs

attempt=0
while [ "$(docker inspect --format '{{.State.Health.Status}}' "$container_name")" != "healthy" ]; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 20 ]; then
    docker inspect --format '{{json .State.Health}}' "$container_name"
    exit 1
  fi
  sleep 1
done

docker inspect --format '{{.State.Health.Status}}' "$container_name"
echo "API smoke test passed on http://127.0.0.1:${host_port}"
