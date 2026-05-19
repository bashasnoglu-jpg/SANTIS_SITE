#!/usr/bin/env bash

# SANTIS OS - Vercel Ignored Build Step Redirector
# Forwards execution to the governed scripts/active/vercel-ignored-build.sh

exec bash scripts/active/vercel-ignored-build.sh "$@"
