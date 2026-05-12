#!/bin/bash
ENTRY=/www/dgkj/admin/assets/entry/index-t6KQ4tdb-1778561346003.js
echo "=== urlPrefix ==="
grep -o 'urlPrefix[^,}]*' "$ENTRY" | sort -u | head -5
echo "--- joinPrefix ---"
grep -o 'joinPrefix[^,}]*' "$ENTRY" | sort -u | head -5
echo "--- apiUrl value ---"
grep -o 'apiUrl[^,}]*' "$ENTRY" | sort -u | head -5
echo "--- double basic-api pattern ---"
grep -o '/basic-api/basic[^'\''" )]*' "$ENTRY" | sort -u | head -5
echo "--- axios baseURL ---"
grep -o 'baseURL:[^,}]*' "$ENTRY" | sort -u | head -5
