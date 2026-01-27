#!/bin/bash
echo "NV Audit Check..."
echo "-----------------"

echo "[1/3] Checking for NV Scaffold in HTML files:"
grep -l "nvList" tr/masajlar/index.html tr/cilt-bakimi/index.html

echo ""
echo "[2/3] Checking for UI Scripts:"
ls assets/js/*-ui.js

echo ""
echo "[3/3] Checking for Data Modules:"
ls assets/js/*-data.js

echo ""
echo "[DONE] Audit complete. See tools/nv-audit-report.md for details."
