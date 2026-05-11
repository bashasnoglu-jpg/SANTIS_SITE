# SANTIS OS Git Flow

## Canonical Branches

### main
Production-ready source. Every commit on main must be deployable.

### develop
Integration branch. Feature, fix, and refactor branches merge here first.

## Branch Prefixes

Allowed prefixes:
- feature/
- fix/
- chore/
- refactor/
- docs/
- hotfix/
- archive/

## Flow
feature/* -> develop -> main
fix/* -> develop -> main
hotfix/* -> main + develop

## Forbidden
- direct commits to main
- unreviewed production changes
- branches without prefix
- duplicate long-living phase branches
