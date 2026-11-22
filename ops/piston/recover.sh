#!/usr/bin/env bash
set -Eeuo pipefail

cd -- "$(dirname -- "$0")"
project=cgp-piston-recovery
volume=cgp-piston-data
old=cgp-piston
backup=cgp-piston-backup
lock_pattern='soft lockup|hard lockup|watchdog:.*lockup|rcu:.*stall'
worker=
watcher=
armed=0

fail() { printf '%s\n' "$*" >&2; exit 1; }

[[ "$(uname -s)" == Linux && $EUID == 0 ]] || fail "Run via sudo on the isolated Ubuntu judge VM."
[[ "${CGP_DEDICATED_PISTON_VM:-}" == 1 ]] || fail "Set CGP_DEDICATED_PISTON_VM=1 on the approved judge VM."
for command in docker timeout flock python3 curl journalctl ss; do
  command -v "$command" >/dev/null || fail "Missing command: $command"
done

if [[ -n "${DOCKER_HOST:-}" && -z "${DOCKER_CONTEXT:-}" ]]; then
  docker_endpoint=$DOCKER_HOST
else
  docker_endpoint=$(timeout 5s docker context inspect --format '{{.Endpoints.docker.Host}}')
fi
[[ "$docker_endpoint" == unix://* ]] || fail "Recovery requires a local Unix-socket Docker endpoint."
case "$(timeout 6s docker info --format '{{.OSType}}|{{.CgroupVersion}}|{{.OperatingSystem}}')" in
  linux\|2\|*Docker\ Desktop*) fail "Use the dedicated VM instead of Docker Desktop." ;;
  linux\|2\|*) ;;
  *) fail "Docker must respond on the VM and use cgroup v2." ;;
esac

worker_id() {
  local id
  id=$(timeout 6s docker ps -aq --no-trunc \
    --filter "label=com.docker.compose.project=$project" \
    --filter 'label=com.docker.compose.service=api')
  [[ "$id" =~ ^[0-9a-f]{64}$ ]] || fail "Expected exactly one recovery worker."
  printf '%s\n' "$id"
}

stop_worker() {
  if ! timeout 10s docker stop --time 3 "$worker" >/dev/null; then
    printf 'Could not stop recovery worker %s. Use the VM console.\n' "$worker" >&2
    return 1
  fi
}

inspect_guest() {
  local available disk root cpus
  timeout 6s docker inspect --format '{{.Name}} {{.State.Status}} {{range .Mounts}}{{.Type}}:{{.Name}}:{{.Destination}} {{end}}' "$old" "$backup"
  timeout 6s docker volume inspect --format '{{.Name}} ({{.Driver}})' "$volume"
  timeout 6s docker image inspect "$(timeout 6s docker inspect --format '{{.Image}}' "$old")" \
    --format '{{range .RepoDigests}}{{println .}}{{end}}'
  uname -r
  cpus=$(getconf _NPROCESSORS_ONLN)
  available=$(awk '/^MemAvailable:/ {print $2}' /proc/meminfo)
  root=$(timeout 6s docker info --format '{{.DockerRootDir}}')
  disk=$(df -Pk -- "$root" | awk 'NR==2 {print $4}')
  printf 'CPUs=%s available-memory-KiB=%s free-Docker-disk-KiB=%s\n' "$cpus" "$available" "$disk"
  printf '%s\n' 'Recent watchdog and memory messages from the current and previous boots:'
  { journalctl -k -b -o short-monotonic --no-pager; journalctl -k -b -1 -o short-monotonic --no-pager || true; } |
    grep -Ei "$lock_pattern|oom|out of memory" | tail -n 40 || true
  [[ "$cpus" =~ ^[0-9]+$ && "$available" =~ ^[0-9]+$ && "$disk" =~ ^[0-9]+$ ]] ||
    fail "Unable to read VM resource headroom."
  (( cpus >= 2 && available >= 2621440 && disk >= 1048576 )) ||
    fail "Require at least two vCPUs, 2.5 GiB available RAM, and 1 GiB free Docker disk."
}

watch_kernel() {
  local cursor=$1 owner=$2 entries next
  while :; do
    if ! kill -0 "$owner" 2>/dev/null; then
      stop_worker || true
      return 1
    fi
    if ! entries=$(timeout 5s journalctl -k -b --after-cursor="$cursor" --show-cursor -o cat --no-pager); then
      printf '%s\n' 'Lost kernel monitoring. Stopping the recovery worker.' >&2
      stop_worker || true
      return 1
    fi
    if grep -Ei "$lock_pattern" <<< "$entries"; then
      printf '%s\n' 'Fresh kernel lockup detected. Stopping the recovery worker.' >&2
      stop_worker || true
      return 1
    fi
    next=$(sed -n 's/^-- cursor: //p' <<< "$entries" | tail -n 1)
    [[ -z "$next" ]] || cursor=$next
    if [[ "$(timeout 5s docker inspect --format '{{.State.Running}}' "$worker")" != true ]]; then
      printf '%s\n' 'Recovery worker is no longer healthy.' >&2
      return 1
    fi
    sleep 1
  done
}

cleanup() {
  local status=$?
  trap - EXIT
  if [[ -n "$watcher" ]]; then
    kill "$watcher" 2>/dev/null || true
    wait "$watcher" 2>/dev/null || true
  fi
  if (( armed )); then stop_worker || status=1; fi
  exit "$status"
}

case "${1:-inspect}" in
  inspect)
    inspect_guest
    ;;
  start)
    export PISTON_IMAGE=${2:-${PISTON_IMAGE:-}}
    [[ "$PISTON_IMAGE" =~ ^ghcr\.io/engineer-man/piston@sha256:[a-f0-9]{64}$ ]] ||
      fail "Supply the reviewed local Piston image digest."
    exec 9>/run/lock/cgp-piston-recovery.lock
    flock -n 9 || fail "A recovery supervisor is already running."
    exec 8>/run/lock/cgp-piston-smoke.lock
    flock -n 8 || fail "Another smoke check is running."

    inspect_guest
    image_id=$(timeout 6s docker image inspect --format '{{.Id}}' "$PISTON_IMAGE")
    timeout 6s docker inspect "$old" "$backup" | python3 recovery-check.py legacy "$image_id"
    users=$(timeout 6s docker ps -q --filter "volume=$volume")
    [[ -z "$users" ]] || fail "Another running container has the legacy data volume."
    [[ -z "$(ss -H -ltn 'sport = :2000')" ]] || fail "Port 2000 is already occupied."
    volume_driver=$(timeout 6s docker volume inspect --format '{{.Driver}}' "$volume")
    [[ "$volume_driver" == local ]] || fail "The legacy data volume must use the local driver."
    volume_path=$(timeout 6s docker volume inspect --format '{{.Mountpoint}}' "$volume")
    [[ "$volume_path" == /* && -d "$volume_path/packages" ]] ||
      fail "The legacy volume does not contain the expected packages directory."
    for package in python/3.12.0 java/15.0.2 gcc/10.2.0 node/20.11.1; do
      [[ -r "$volume_path/packages/$package/pkg-info.json" ]] ||
        fail "Missing installed package $package in the legacy volume."
    done
    printf '%s\n' 'Found all four installed package directories using a read-only check.'

    cursor=$(journalctl -k -b -n 1 --show-cursor -o cat --no-pager |
      sed -n 's/^-- cursor: //p' | tail -n 1)
    [[ -n "$cursor" ]] || fail "Kernel journal monitoring is unavailable."
    timeout 25s docker compose -p "$project" up --no-start --no-recreate --no-deps --pull never api
    worker=$(worker_id)
    timeout 6s docker inspect "$worker" | python3 recovery-check.py worker "$image_id"

    trap cleanup EXIT
    trap 'exit 130' INT
    trap 'exit 1' TERM HUP
    armed=1
    timeout 12s docker start "$worker" >/dev/null
    watch_kernel "$cursor" "$$" &
    watcher=$!
    python3 recovery-check.py first
    flock -u 8
    exec 8>&-
    printf '%s\n' 'One Python job passed. Keep this terminal open for kernel monitoring. Ctrl+C stops the recovery worker.'
    wait "$watcher"
    ;;
  serial|pair)
    worker=$(worker_id)
    [[ "$(timeout 6s docker inspect --format '{{.State.Running}}' "$worker")" == true ]] ||
      fail "The recovery worker is stopped."
    # The start session holds this lock for its entire watchdog lifetime.
    if flock -n /run/lock/cgp-piston-recovery.lock true; then
      fail "Start the guarded recovery session before running more jobs."
    fi
    exec 8>/run/lock/cgp-piston-smoke.lock
    flock -n 8 || fail "Another smoke check is running."
    if ! python3 recovery-check.py "$1"; then
      printf '%s\n' 'Smoke check failed. Stopping the recovery worker.' >&2
      stop_worker || true
      exit 1
    fi
    ;;
  stop)
    worker=$(worker_id)
    stop_worker
    ;;
  *)
    fail "Usage: recover.sh {inspect|start <reviewed-image-digest>|serial|pair|stop}"
    ;;
esac
