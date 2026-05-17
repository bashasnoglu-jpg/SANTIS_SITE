#!/bin/bash

set -e

if git diff HEAD^ HEAD --quiet admin-panel/ packages/ package.json pnpm-lock.yaml pnpm-workspace.yaml; then
  echo "🛑 No admin-panel or shared dependency changes detected. Skipping Vercel build."
  exit 0
fi

echo "✅ Relevant admin-panel changes detected. Running Vercel build."
exit 1
