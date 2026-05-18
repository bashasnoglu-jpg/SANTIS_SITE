#!/usr/bin/env bash

set -euo pipefail

WATCH_PATHS=(
  "admin-panel"
  "packages"
  "package.json"
  "pnpm-lock.yaml"
  "pnpm-workspace.yaml"
  "turbo.json"
  "vercel.json"
  "vercel-ignored-build.sh"
)

if [[ -z "${VERCEL_GIT_PREVIOUS_SHA:-}" || "${VERCEL_GIT_PREVIOUS_SHA}" =~ ^0+$ ]]; then
  echo "No previous Vercel commit SHA available. Running Vercel build."
  exit 1
fi

if ! git cat-file -e "${VERCEL_GIT_PREVIOUS_SHA}^{commit}" 2>/dev/null; then
  echo "Previous Vercel commit SHA is unavailable locally. Running Vercel build."
  exit 1
fi

if git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- "${WATCH_PATHS[@]}"; then
  echo "No admin-panel, shared dependency, or deployment config changes detected. Skipping Vercel build."
  exit 0
fi

echo "Relevant admin-panel, shared dependency, or deployment config changes detected. Running Vercel build."
exit 1
