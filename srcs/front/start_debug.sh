#!/bin/sh

# Désactive le warning Browserslist
export BROWSERSLIST_IGNORE_OLD_DATA=1

echo "🔧 Starting development environment..."
echo ""

# 1. ESBuild watch (Remplace TypeScript tsc)
echo "⚡ Starting ESBuild watcher..."
cd /usr/share/nginx/html && esbuild ./scripts/main.ts --bundle --outfile=./dist/main.js --watch=forever > /tmp/esbuild.log 2>&1 &
ESBUILD_PID=$!
echo "   ✓ ESBuild watcher started (PID: $ESBUILD_PID)"

# 2. Première compilation Tailwind
echo ""
echo "🎨 Compiling Tailwind CSS (initial build)..."
cd /usr/share/nginx/html && tailwindcss -i ./styles/input.css -o ./dist/style.css --minify

if [ -f /usr/share/nginx/html/dist/style.css ]; then
    SIZE=$(du -h /usr/share/nginx/html/dist/style.css | cut -f1)
    echo "   ✓ dist/style.css generated ($SIZE)"
else
    echo "   ❌ ERROR: dist/style.css not generated!"
fi

# 3. Nodemon pour le CSS (Inchangé)
echo ""
echo "👀 Starting nodemon for CSS..."
nodemon \
    --watch /usr/share/nginx/html/styles/input.css \
    --exec "echo '🔄 input.css changed' && cd /usr/share/nginx/html && tailwindcss -i ./styles/input.css -o ./dist/style.css --minify && echo '✅ CSS recompiled'" \
    > /tmp/nodemon.log 2>&1 &
NODEMON_PID=$!
echo "   ✓ Nodemon started (PID: $NODEMON_PID)"

# 4. inotifywait (Inchangé)
echo ""
echo "👀 Starting inotifywait for content files..."
/usr/share/nginx/html/watch-content.sh > /tmp/inotify.log 2>&1 &
INOTIFY_PID=$!
echo "   ✓ inotifywait started (PID: $INOTIFY_PID)"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🔄 Active watchers:"
echo "   - ESBuild (PID: $ESBUILD_PID)"
echo "   - Nodemon (PID: $NODEMON_PID)"
echo "   - inotifywait (PID: $INOTIFY_PID)"
echo ""
echo "🔍 Monitor logs:"
echo "   docker exec front tail -f /tmp/esbuild.log"
echo ""
echo "🚀 Starting nginx..."
nginx -g 'daemon off;'