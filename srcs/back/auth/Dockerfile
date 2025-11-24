#----------------------------
# STEP 1: BUILD APP
#----------------------------
        
FROM node:20-alpine AS build

#-----------------------INSTALL BUILD DEPENDENCIES FOR ARGON2
RUN apk add --no-cache python3 make g++ sqlite

#-----------------------DEFINE WORKING DIRECTORY
WORKDIR /app/auth

#-----------------------COPY PACKAGE .JSON & PACKAGE-LOCK.JSON
COPY ./conf/package*.json ./

#-----------------------INSTALL DEPENDENCIES (DEVDEPENDENCIES INCLUDED)
RUN npm install

#-----------------------COPY SOURCE CODE
COPY . .

#-----------------------BUILD STATIC FILES
RUN npm run build

#----------------------------
# STEP 2: FINAL IMAGE
#----------------------------

FROM node:20-alpine


#-----------------------INSTALL RUNTIME DEPENDENCIES FOR ARGON2
RUN apk add --no-cache libstdc++ sqlite

WORKDIR /app/auth

#-----------------------COPY NECESSARY FILES FROM PREVIOUS STEP
COPY --from=build /app/auth/package*.json ./
COPY --from=build /app/auth/node_modules ./node_modules
COPY --from=build /app/auth/dist ./dist

#-----------------------CREATE A DIRECTORY FOR PERSISTENCE
RUN mkdir -p /app/data

# #-----------------------ENV POINTING TO SHARED DB
# ENV DATABASE_URL="/app/data/auth.sqlite"
# plus besoin car mis dans le docker-compose + à mettre dans le index.ts

#-----------------------EXPOSE INTERNAL PORT
EXPOSE 3001

#-----------------------START PRODUCTION MODE
CMD ["node", "dist/index.js"]
