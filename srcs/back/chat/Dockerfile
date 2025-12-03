#----------------------------
# STEP 1: BUILD APP
#----------------------------
        
FROM node:20-alpine AS build

RUN apk add --no-cache sqlite

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

RUN apk add --no-cache \
    openssl \
    sqlite \
    su-exec

# COPY entrypoint.sh /app/entrypoint.sh


# RUN chmod +x /app/entrypoint.sh

WORKDIR /app/chat

#-----------------------COPY NECESSARY FILES FROM PREVIOUS STEP
COPY --from=build /app/chat/package*.json ./
COPY --from=build /app/chat/node_modules ./node_modules
COPY --from=build /app/chat/dist ./dist

RUN mkdir -p /app/data


#-----------------------EXPOSE INTERNAL PORT
EXPOSE 3002

#-----------------------START PRODUCTION MODE
# ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
CMD ["node", "dist/index.js"]