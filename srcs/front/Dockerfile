#----------------------------
# STEP 1: BUILD FRONTEND
#----------------------------
        
FROM node:20-alpine AS build

#-----------------------DEFINE WORKING DIRECTORY
WORKDIR /app/front

#-----------------------COPY PACKAGE .JSON & PACKAGE-LOCK.JSON
COPY ./package*.json ./

#-----------------------INSTALL DEPENDENCIES (DEVDEPENDENCIES INCLUDED)
RUN npm ci

#-----------------------COPY SOURCE CODE
COPY . .

#-----------------------BUILD STATIC FILES
RUN npm run build

#AJOUT DE TSX WATCH
# Installation, initialisation et compilation du css avec tailwind
RUN npx tailwindcss -i ./styles/input.css -o ./dist/style.css --minify

# Vérification que output.css a bien été créé
RUN test -f ./dist/style.css || (echo "ERROR: dist/style.css not generated!" && exit 1)
# A SUPPRIMER | Seulement pour le dev
RUN apk add --no-cache npm inotify-tools
RUN npm install -g typescript nodemon tailwindcss@3.4.18
#####################################


# A SUPPRIMER ##################################################
# Copie du script de demarage pour le hot reload
# 1. On corrige la SOURCE (start_debug.sh est à la racine, watch-content.sh dans scripts/)
# 2. On corrige la DESTINATION (vers /usr/share/... pour correspondre à votre nginx.conf)

COPY start_debug.sh /usr/share/nginx/html/start_debug.sh
COPY scripts/watch-content.sh /usr/share/nginx/html/watch-content.sh

RUN chmod +x /usr/share/nginx/html/start_debug.sh /usr/share/nginx/html/watch-content.sh

# CMD pour le dev 
CMD ["/usr/share/nginx/html/start_debug.sh"]
# A SUPPRIMER ##################################################
#-------------------------------------
# STEP 2: STATIC SERVER WITH NGINX (DEV VERSION)
#-------------------------------------

FROM nginx:alpine-slim

# 1. Installer Node.js et les outils de surveillance DANS L'IMAGE FINALE
RUN apk add --no-cache nodejs npm inotify-tools
RUN npm install -g typescript nodemon tailwindcss@3.4.18

# 2. Copier les fichiers compilés depuis le build
COPY --from=build /app/front/dist /usr/share/nginx/html/dist
COPY --from=build /app/front/public/index.html /usr/share/nginx/html/index.html
COPY --from=build /app/front/public/assets /usr/share/nginx/html/assets

# 3. Copier la config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 4. Copier vos scripts de dev (ATTENTION aux chemins ici)
COPY start_debug.sh /usr/share/nginx/html/start_debug.sh
COPY scripts/watch-content.sh /usr/share/nginx/html/watch-content.sh

# 5. Rendre les scripts exécutables
RUN chmod +x /usr/share/nginx/html/start_debug.sh /usr/share/nginx/html/watch-content.sh

# 6. Exposer le port
EXPOSE 80

# 7. LANCER VOTRE SCRIPT AU LIEU DE NGINX DIRECTEMENT
CMD ["/usr/share/nginx/html/start_debug.sh"]