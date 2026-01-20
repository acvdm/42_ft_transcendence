#----------------------------
# STEP 1: BUILD FRONTEND
#----------------------------
FROM node:20-alpine AS build

WORKDIR /app/front

# Installation des dépendances
COPY ./package*.json ./
COPY ./tailwind.config.js ./
COPY ./tsconfig.json ./

RUN npm ci

# Copie des sources
COPY . .

# Compilation du JS et du CSS (génère les fichiers dans ./dist)
RUN npm run build

#-------------------------------------
# STEP 2: STATIC SERVER WITH NGINX (PRODUCTION)
#-------------------------------------
FROM nginx:alpine-slim

# On copie uniquement les fichiers compilés et les assets depuis l'étape de build
# Pas besoin de node_modules, npm ou esbuild ici, tout est déjà 'bundlé' dans main.js
COPY --from=build /app/front/dist /usr/share/nginx/html/dist
COPY --from=build /app/front/public/index.html /usr/share/nginx/html/index.html
COPY --from=build /app/front/public/assets /usr/share/nginx/html/assets

# Configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# On expose le port 80 et on lance Nginx simplement
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]