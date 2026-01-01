#!/bin/sh

export BROWSERSLIST_IGNORE_OLD_DATA=1

echo "🔧 Starting development environment..."

mkdir -p /usr/share/nginx/html/dist

echo ""

# 1. ESBuild watch
echo "⚡ Starting ESBuild watcher..."
cd /usr/share/nginx/html && esbuild ./scripts/main.ts \
  --bundle \
  --outfile=./dist/main.js \
  --watch=forever \
  --loader:.html=text \
  > /tmp/esbuild.log 2>&1 &
ESBUILD_PID=$!
echo "   ✓ ESBuild watcher started (PID: $ESBUILD_PID)"

# 2. Tailwind CSS Watch
echo ""
echo "🎨 Starting Tailwind CSS watcher..."
cd /usr/share/nginx/html && tailwindcss \
  -i ./styles/input.css \
  -o ./dist/style.css \
  --minify \
  --watch \
  > /tmp/tailwindcss.log 2>&1 &
TAILWIND_PID=$!
echo "   ✓ Tailwind watcher started (PID: $TAILWIND_PID)"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🔄 Active watchers:"
echo "   - ESBuild (PID: $ESBUILD_PID)"
echo "   - Tailwind (PID: $TAILWIND_PID)"
echo ""
echo "📝 Log files:"
echo "   - ESBuild:       /tmp/esbuild.log"
echo "   - Tailwind:      /tmp/tailwindcss.log"
echo ""

# Attendre un peu que les compilations initiales se fassent
sleep 3

echo "🚀 Starting nginx..."
nginx -g 'daemon off;'