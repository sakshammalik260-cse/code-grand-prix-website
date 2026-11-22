#!/usr/bin/env sh
set -eu

exec bash "$(dirname "$0")/recover.sh" start "${1:-${PISTON_IMAGE:-}}"
