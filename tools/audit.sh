#!/bin/bash
# SANTIS CLUB - AUDIT SCRIPT
# Checks for forbidden non-Turkish patterns.
# Usage: ./tools/audit.sh

echo "======================================"
echo "SANTIS CLUB - TR-ONLY AUDIT"
echo "======================================"

FAIL=0

check_pattern() {
    PATTERN="$1"
    DESC="$2"
    COUNT=$(grep -r "$PATTERN" . --exclude-dir=node_modules --exclude-dir=.git --exclude=audit.sh --exclude=audit-report.md --exclude=santis-hotels.json --exclude=site_content.json | wc -l)
    
    if [ "$COUNT" -eq "0" ]; then
        echo "✅ [OK] $DESC: 0 hits"
    else
        echo "❌ [FAIL] $DESC: $COUNT hits found!"
        grep -r "$PATTERN" . --exclude-dir=node_modules --exclude-dir=.git --exclude=audit.sh --exclude=audit-report.md --exclude=santis-hotels.json --exclude=site_content.json
        FAIL=1
    fi
}

# 1. Non-TR Links
check_pattern 'href="en/' 'Relative EN link (href="en/)'
check_pattern 'href="/en/' 'Absolute EN link (href="/en/)'
check_pattern 'href="../en/' 'Parent EN link (href="../en/)'
check_pattern 'href="./en/' 'Current EN link (href="./en/)'

# 2. Query Params
check_pattern '?lang=' 'URL Query Param (?lang=)'
check_pattern 'get("lang")' 'JS URLSearchParams (get("lang"))'

# 3. SEO / Meta
check_pattern 'hreflang="en' 'Hreflang English'
check_pattern 'hreflang="fr' 'Hreflang French'
check_pattern 'hreflang="de' 'Hreflang German'
check_pattern 'hreflang="ru' 'Hreflang Russian'

# 4. JS/Legacy Patterns
check_pattern '\.translations\[lang\]' 'JS Legacy translations[lang]'
check_pattern 'name\[STATE\.lang\]' 'JS Legacy name[STATE.lang]'
check_pattern 'hammam-zigzag-en\.js' 'Legacy Script Reference'

echo "======================================"
if [ "$FAIL" -eq "0" ]; then
    echo "🎉 AUDIT PASSED: All checks clean."
    exit 0
else
    echo "🔥 AUDIT FAILED: Fix the issues above."
    exit 1
fi
