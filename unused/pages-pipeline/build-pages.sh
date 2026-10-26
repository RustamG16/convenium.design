#!/usr/bin/env bash
# Assembles the GitHub Pages site into _site/: one landing page plus /plain/ and /convenium/.
# A site folder with package.json is built with npm (expects output in dist/ with relative asset paths);
# any other folder is copied as static files.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf _site && mkdir -p _site
for s in plain convenium; do
  d="sites/$s"
  [ -d "$d" ] || continue
  if [ -f "$d/package.json" ]; then
    (cd "$d" && npm ci && npm run build)
    out="$d/dist"; [ -d "$out" ] || out="$d/build"
    cp -r "$out" "_site/$s"
  else
    cp -r "$d" "_site/$s"
    rm -rf "_site/$s/.olympus" "_site/$s/node_modules" "_site/$s/PROFILE.md" "_site/$s/PROMPT.md"
  fi
done
touch _site/.nojekyll
cat > _site/index.html <<'HTML'
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rustam universe — two builds</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0a09;color:#ece6d6;font:18px/1.5 Georgia,serif}
main{max-width:640px;padding:32px}h1{font-weight:400;font-size:40px;margin:0 0 8px}p{color:#9a9183}a{display:block;margin:18px 0;padding:18px 22px;border:1px solid #3a342c;color:#e6c16b;text-decoration:none}a:hover{border-color:#e6c16b}small{display:block;color:#9a9183;font-size:14px}</style></head>
<body><main><h1>Rustam universe</h1><p>The same brief, the same assets, two builds.</p>
<a href="plain/">Plain build <small>Default Claude agent (Sonnet), no skills, plugins or connectors</small></a>
<a href="convenium/">Convenium.Design build <small>Fable 5.1 with the Convenium.Design system and every connector</small></a>
</main></body></html>
HTML
echo "built:"; find _site -maxdepth 2 | head -40
