#!/bin/bash
echo '=== Ge variable value ==='
grep -o '"\/basic-api"' /www/dgkj/admin/assets/entry/index-t6KQ4tdb-1778561346003.js | head -3
echo '---'
grep -o "'Ge=[^,]*" /www/dgkj/admin/assets/entry/index-t6KQ4tdb-1778561346003.js | head -3
echo '---'
# Search for where apiUrl gets set
grep -o 'apiUrl:".*"' /www/dgkj/admin/assets/entry/index-t6KQ4tdb-1778561346003.js | head -3
echo '---'
# Find all places that set baseURL or apiUrl in axios
grep -o 'baseURL[^,;]*' /www/dgkj/admin/assets/entry/index-t6KQ4tdb-1778561346003.js | head -5
echo '---'
# Search for where the doubled path might come from - look for pattern basic-api/basic
grep -o '/basic-api/basic[^'\''" ]*' /www/dgkj/admin/assets/entry/index-t6KQ4tdb-1778561346003.js | head -5
