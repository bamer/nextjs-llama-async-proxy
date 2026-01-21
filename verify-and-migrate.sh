#!/bin/bash
echo "=== Checking syntax of modified files ==="
for file in \
  "server/handlers/llama.js" \
  "server/handlers/models/scan.js" \
  "server/handlers/presets/handlers.js" \
  "server/db/config.js" \
  "server/db/unified-config.js" \
  "server/db/db-base.js" \
  "server/handlers/constants.js" \
  "public/js/services/notification.js" \
  "public/js/pages/settings/settings-page.js"
do
  echo -n "Checking $file... "
  if node --check "$file" 2>&1; then
    echo "OK"
  else
    echo "FAILED"
  fi
done

echo ""
echo "=== Running config migration script ==="
node server/db/migrate-config.js
