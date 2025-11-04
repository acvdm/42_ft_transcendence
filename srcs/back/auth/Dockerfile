#----------------------------
# STEP 1: BUILD APP
#----------------------------
        
FROM node:20-alpine AS build

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

WORKDIR /app/auth

#-----------------------COPY NECESSARY FILES FROM PREVIOUS STEP
COPY --from=build /app/auth/package*.json ./
COPY --from=build /app/auth/node_modules ./node_modules
COPY --from=build /app/auth/dist ./dist

#-----------------------CREATE A DIRECTORY FOR PERSISTENCE
RUN mkdir -p /app/auth/data

#-----------------------DEFINE AN ENV VAR FOR LOCAL STORAGE
ENV DATABASE_URL="file:/app/auth/data/auth.sqlite"

#-----------------------EXPOSE INTERNAL PORT
EXPOSE 3001

#-----------------------START PRODUCTION MODE
CMD ["node", "dist/index.js"]
