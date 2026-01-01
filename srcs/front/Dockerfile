#----------------------------
# STEP 1: BUILD FRONTEND
#----------------------------
        
FROM node:20-alpine AS build

#-----------------------DEFINE WORKING DIRECTORY
WORKDIR /app/front

#-----------------------COPY PACKAGE .JSON & PACKAGE-LOCK.JSON je rajoute front
COPY front/package*.json ./front/

#-----------------------INSTALL DEPENDENCIES (DEVDEPENDENCIES INCLUDED) je rajoute cdfront
RUN cd front && npm ci

# ON COPIE TOUT (front et shared) j'ajoute ici 
COPY shared ./shared
COPY front ./front

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

# 1. On installe esbuild
RUN apk add --no-cache nodejs npm inotify-tools
RUN npm install -g typescript nodemon tailwindcss@3.4.18 esbuild

# 2. On copie les fichiers compilés
COPY --from=build /app/front/dist /usr/share/nginx/html/dist
COPY --from=build /app/front/public/index.html /usr/share/nginx/html/index.html
COPY --from=build /app/front/public/assets /usr/share/nginx/html/assets

# 3. IMPORTANT : On copie les node_modules pour qu'esbuild trouve 'socket.io-client'
COPY --from=build /app/front/node_modules /usr/share/nginx/html/node_modules

# ... (reste inchangé: COPY nginx.conf, COPY scripts, etc.)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY start_debug.sh /usr/share/nginx/html/start_debug.sh
COPY scripts/watch-content.sh /usr/share/nginx/html/watch-content.sh
RUN chmod +x /usr/share/nginx/html/start_debug.sh /usr/share/nginx/html/watch-content.sh
EXPOSE 80
CMD ["/usr/share/nginx/html/start_debug.sh"]