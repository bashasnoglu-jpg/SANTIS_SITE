#!/bin/bash

# Vercel Ignored Build Step for SANTIS OS
# Resolves the Vercel deploy blocker for the admin panel by providing the expected script.

echo "=== VERCEL IGNORED BUILD STEP ENGINE ==="
echo "Target Project: santis-site-admin-panel"
echo "Commit Ref: $VERCEL_GIT_COMMIT_REF"
echo "Commit Message: $VERCEL_GIT_COMMIT_MESSAGE"

# Safe fallback: if VERCEL_GIT_COMMIT_REF is not set, proceed with build.
if [ -z "$VERCEL_GIT_COMMIT_REF" ]; then
  echo "⚠️ VERCEL_GIT_COMMIT_REF is empty. Proceeding with build as safe fallback."
  exit 1
fi

# Always build on production (main) and integration (develop) branches
if [[ "$VERCEL_GIT_COMMIT_REF" == "develop" || "$VERCEL_GIT_COMMIT_REF" == "main" ]]; then
  echo "✅ Integration/Production branch detected ($VERCEL_GIT_COMMIT_REF). Proceeding with build."
  exit 1
fi

# For PRs or other feature branches, only build if relevant directories/files changed
echo "Analyzing Git diff for changes..."
if git diff --name-only HEAD~1 | grep -E "^(admin-panel/|assets/|package\.json|pnpm-workspace\.yaml|pnpm-lock\.yaml|vercel\.json|vercel-ignored-build\.sh)" > /dev/null; then
  echo "✅ Changes detected in admin-panel, assets, or workspace configs. Proceeding with build."
  exit 1
else
  echo "🛑 No changes in relevant surfaces. Skipping build."
  exit 0
fi
