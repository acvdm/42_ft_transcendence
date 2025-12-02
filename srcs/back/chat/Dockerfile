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

COPY entrypoint.sh /app/entrypoint.sh
# COPY certificate.crt /app/certificate.crt
# COPY private_key.key /app/private_key.key


RUN chmod +x /app/entrypoint.sh

# #-----------------------GENERERATE AUTO-SIGNED CERTIFICATE 
# RUN mkdir -p /app/certificates && cd /app/certificates

# RUN openssl req -x509 -nodes -days 365 \
#         -out certificate.crt \
#         -keyout private_key.key \
#         -subj "/CN=localhost"

WORKDIR /app/chat

#-----------------------COPY NECESSARY FILES FROM PREVIOUS STEP
COPY --from=build /app/chat/package*.json ./
COPY --from=build /app/chat/node_modules ./node_modules
COPY --from=build /app/chat/dist ./dist

# #-----------------------CREATE A DIRECTORY FOR PERSISTENCE
# RUN mkdir -p /app/data

#-----------------------ENV POINTING TO SHARED DB
# ENV DATABASE_URL="file:/app/data/database.sqlite"

#-----------------------EXPOSE INTERNAL PORT
EXPOSE 3002

#-----------------------START PRODUCTION MODE
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
CMD ["node", "dist/index.js"]