#----------------------------
# STEP 1: BUILD APP
#----------------------------
        
FROM node:20-alpine AS build

#-----------------------DEFINE WORKING DIRECTORY
WORKDIR /app/chat

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

WORKDIR /app/chat

#-----------------------COPY NECESSARY FILES FROM PREVIOUS STEP
COPY --from=build /app/chat/package*.json ./
COPY --from=build /app/chat/node_modules ./node_modules
COPY --from=build /app/chat/dist ./dist

#-----------------------CREATE A DIRECTORY FOR PERSISTENCE
RUN mkdir -p /app/data

#-----------------------ENV POINTING TO SHARED DB
# ENV DATABASE_URL="file:/app/data/database.sqlite"

#-----------------------EXPOSE INTERNAL PORT
EXPOSE 3002

#-----------------------START PRODUCTION MODE
CMD ["node", "dist/index.js"]