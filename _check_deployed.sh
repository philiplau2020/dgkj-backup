#!/bin/bash
echo '=== index.html ==='
head -50 /www/dgkj/admin/index.html
echo ''
echo '=== apiUrl values in JS chunks ==='
grep -oh 'apiUrl:[^,}]*' /www/dgkj/admin/assets/*.js 2>/dev/null | sort -u
echo ''
echo '=== Check deploy timestamp ==='
ls -la /www/dgkj/admin/assets/index-*.js 2>/dev/null | head -5
echo ''
echo '=== grep for auth/login path ==='
grep -oh '"/basic-api/auth/login"' /www/dgkj/admin/assets/*.js 2>/dev/null | head -5
grep -oh '"auth/login"' /www/dgkj/admin/assets/*.js 2>/dev/null | head -5
