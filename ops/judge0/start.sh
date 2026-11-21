#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
engine=$(docker info --format '{{.OSType}}|{{.CgroupVersion}}|{{.OperatingSystem}}')
case "$engine" in
  linux\|1\|*Docker\ Desktop*) echo "Use a dedicated Linux VM, outside Docker Desktop." >&2; exit 1 ;;
  linux\|1\|*) ;;
  *) echo "Judge0 CE v1.13.1 requires a Linux Docker engine with cgroup v1 for this profile." >&2; exit 1 ;;
esac
[ "$(uname -s)" = "Linux" ] || { echo "Run this on the dedicated Linux VM." >&2; exit 1; }
[ "${CGP_DEDICATED_JUDGE_VM:-}" = "1" ] || { echo "Set CGP_DEDICATED_JUDGE_VM=1 on the dedicated judge VM." >&2; exit 1; }
if [ ! -f .judge0.env ]; then
  umask 077
  (
    set -C
    sed \
      -e "s/^POSTGRES_PASSWORD=$/POSTGRES_PASSWORD=$(openssl rand -hex 32)/" \
      -e "s/^REDIS_PASSWORD=$/REDIS_PASSWORD=$(openssl rand -hex 32)/" \
      -e "s/^AUTHN_TOKEN=$/AUTHN_TOKEN=$(openssl rand -hex 32)/" \
      -e "s/^SECRET_KEY_BASE=$/SECRET_KEY_BASE=$(openssl rand -hex 64)/" \
      judge0.env.example > .judge0.env
  )
fi
for key in POSTGRES_PASSWORD REDIS_PASSWORD AUTHN_TOKEN SECRET_KEY_BASE; do
  grep -Eq "^${key}=[a-f0-9]{64,}$" .judge0.env || { echo "Invalid or missing ${key} in .judge0.env." >&2; exit 1; }
done
docker compose up -d db redis api
timeout 45 docker compose exec -T api bash -ec 'source ./scripts/load-config; until curl -fsS -H "X-Auth-Token: $AUTHN_TOKEN" http://127.0.0.1:2358/about >/dev/null 2>&1; do sleep 1; done'
docker compose up -d worker
