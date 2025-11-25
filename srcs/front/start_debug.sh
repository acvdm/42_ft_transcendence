#!/bin/sh

# Désactive le warning Browserslist
export BROWSERSLIST_IGNORE_OLD_DATA=1

echo "🔧 Starting development environment..."
echo ""

# 1. TypeScript watch
echo "📘 Starting TypeScript watch..."
cd /usr/share/nginx/html && tsc --watch > /tmp/tsc.log 2>&1 &
TSC_PID=$!
echo "   ✓ TypeScript watcher started (PID: $TSC_PID)"

# 2. Première compilation Tailwind
echo ""
echo "🎨 Compiling Tailwind CSS (initial build)..."
# On génère dist/style.css à partir de styles/input.css
cd /usr/share/nginx/html && tailwindcss -i ./styles/input.css -o ./dist/style.css --minify

# VERIFICATION CORRIGÉE : On vérifie le fichier qu'on vient de créer (dist/style.css)
if [ -f /usr/share/nginx/html/dist/style.css ]; then
    SIZE=$(du -h /usr/share/nginx/html/dist/style.css | cut -f1)
    echo "   ✓ dist/style.css generated ($SIZE)"
else
    echo "   ❌ ERROR: dist/style.css not generated!"
    # On continue quand même pour ne pas bloquer le conteneur si c'est juste un délai
fi

# 3. Nodemon pour le CSS
echo ""
echo "👀 Starting nodemon for CSS..."
# CORRECTION : On surveille styles/input.css
nodemon \
    --watch /usr/share/nginx/html/styles/input.css \
    --exec "echo '🔄 input.css changed' && cd /usr/share/nginx/html && tailwindcss -i ./styles/input.css -o ./dist/style.css --minify && echo '✅ CSS recompiled'" \
    > /tmp/nodemon.log 2>&1 &
NODEMON_PID=$!
echo "   ✓ Nodemon started (PID: $NODEMON_PID)"

# 4. inotifywait pour les fichiers de contenu
echo ""
echo "👀 Starting inotifywait for content files..."
/usr/share/nginx/html/watch-content.sh > /tmp/inotify.log 2>&1 &
INOTIFY_PID=$!
echo "   ✓ inotifywait started (PID: $INOTIFY_PID)"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🔄 Active watchers:"
echo "   - TypeScript (PID: $TSC_PID)"
echo "   - Nodemon (PID: $NODEMON_PID)"
echo "   - inotifywait (PID: $INOTIFY_PID)"
echo ""
echo "📝 Log files:"
echo "   - TypeScript:      /tmp/tsc.log"
echo "   - Nodemon:         /tmp/nodemon.log"
echo "   - inotifywait:     /tmp/inotify.log"
echo ""
echo "🔍 Monitor in real-time:"
echo "   docker exec front tail -f /tmp/nodemon.log"
echo ""
echo "🚀 Starting nginx..."
nginx -g 'daemon off;'