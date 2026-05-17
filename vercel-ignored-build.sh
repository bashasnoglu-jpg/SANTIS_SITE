#!/bin/bash

set -e

WATCH_PATHS="admin-panel/ packages/ package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json vercel.json"

if [[ -n "$VERCEL_GIT_PREVIOUS_SHA" ]] && git diff "$VERCEL_GIT_PREVIOUS_SHA" HEAD --quiet $WATCH_PATHS; then
  echo "🛑 No admin-panel, shared dependency, or deployment config changes detected. Skipping Vercel build."
  exit 0
fi

echo "✅ Relevant admin-panel, shared dependency, or deployment config changes detected. Running Vercel build."
exit 1
