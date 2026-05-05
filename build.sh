#!/bin/bash
# Build script: produces dist/ folder ready for Cloudflare Pages
# dist/index.html = the app
# dist/api/send.js = not needed (CF Pages Functions handles it)

set -e

mkdir -p dist

# ─── Build the single-file HTML ─────────────────────────────────────────────
cat > dist/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Postmark Email Tester</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%23ffde00'/></svg>">
    <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%23ffde00'/></svg>">
    <meta name="theme-color" content="#ffde00">
    <meta name="worker-url" content="/api/send">
    <style>
HTMLEOF

cat src/styles.css >> dist/index.html

cat >> dist/index.html << 'HTMLEOF'
    </style>
</head>
HTMLEOF

# Extract body from src/index.html
sed -n '/<body>/,/<\/body>/p' src/index.html | sed '1d;$d' >> dist/index.html

# Inline JS
cat >> dist/index.html << 'HTMLEOF'
    <script>
HTMLEOF

cat src/template.js >> dist/index.html
echo "" >> dist/index.html
cat src/app.js >> dist/index.html

cat >> dist/index.html << 'HTMLEOF'
    </script>
</body>
</html>
HTMLEOF

# Remove external script refs
sed -i.bak '/<script src="/d' dist/index.html
rm -f dist/index.html.bak

echo "Built dist/index.html ($(wc -c < dist/index.html | tr -d ' ') bytes)"
