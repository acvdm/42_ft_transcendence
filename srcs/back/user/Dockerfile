#----------------------------
# STEP 1: BUILD APP
#----------------------------
        
FROM node:20-alpine AS build

#-----------------------DEFINE WORKING DIRECTORY
WORKDIR /app/user

#-----------------------COPY PACKAGE .JSON & PACKAGE-LOCK.JSON
COPY package*.json ./

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

WORKDIR /app/user

#-----------------------COPY NECESSARY FILES FROM PREVIOUS STEP
COPY --from=build /app/user/package*.json ./
COPY --from=build /app/user/node_modules ./node_modules
COPY --from=build /app/user/dist ./dist

#-----------------------CREATE A DIRECTORY TO UPLAOD AVATARS
RUN mkdir -p /app/user/uploads

#-----------------------DEFINE AN ENV VAR FOR LOCAL STORAGE
ENV DATABASE_URL="file:/app/user/database.sqlite"

#-----------------------EXPOSE INTERNAL PORT
EXPOSE 3004

#-----------------------START PRODUCTION MODE
CMD ["node", "dist/main.js"]