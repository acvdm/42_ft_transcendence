#----------------------------
# STEP 1: BUILD FRONTEND
#----------------------------
        
FROM node:20-alpine AS build

#-----------------------DEFINE WORKING DIRECTORY
WORKDIR /app/front

#-----------------------COPY PACKAGE .JSON & PACKAGE-LOCK.JSON
COPY ./package*.json ./

#-----------------------INSTALL DEPENDENCIES (DEVDEPENDENCIES INCLUDED)
RUN npm install

#-----------------------COPY SOURCE CODE
COPY . .

#-----------------------BUILD STATIC FILES
RUN npm run build

#-------------------------------------
# STEP 2: STATIC SERVER WITH NGINX
#-------------------------------------

FROM nginx:alpine-slim

# #-----------------------REMOVE NGINX DEFAULT CONFIGURATION
# RUN rm /etc/nginx/conf.d/default.conf

# #-----------------------REPLACE DEFAULT CONF
# COPY ./conf/nginx.conf /etc/nginx/conf.d/default.conf

#-----------------------COPY STATIC FILES FROM THE BUILD INSIDE THE DOCKER
# Copie le JS et le CSS compilés
COPY --from=build /app/front/dist /usr/share/nginx/html/dist

# Copie la page HTML principale (qui est dans /public)
COPY --from=build /app/front/public/index.html /usr/share/nginx/html/index.html

#-----------------------EXPOSE INTERNAL PORT
EXPOSE 80

#-----------------------LAUNCH NGINX AS PID 1
CMD ["nginx", "-g", "daemon off;"]