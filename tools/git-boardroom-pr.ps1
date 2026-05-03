# Santis OS - Boardroom Action Rail PR Script
# Run this to create the branch and push changes

$branchName = "feat/boardroom-action-rail"
git checkout -b $branchName

git add packages/event-dictionary/src/index.ts
git add packages/domain-schema/src/sse-envelope.contract.ts
git add apps/ingestion-api/src/services/sse-manager.ts
git add apps/ingestion-api/src/handlers/register-command-handlers.ts
git add admin/assets/js/santis-core.js
git add assets/js/core/santis-live-feed.js
git add admin/assets/js/boardroom-action-rail.js
git add admin/boardroom.html

git commit -m "feat(boardroom): add deterministic action rail command loop"

Write-Host "✅ Changes committed to $branchName"
Write-Host "🚀 Run 'git push origin $branchName' to open the PR."
