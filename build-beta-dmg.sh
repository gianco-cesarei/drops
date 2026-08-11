#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
export DROPS_BUILD_CHANNEL=beta
exec ./build-dmg.sh
