#----------------------------
# STEP 1: BUILD APP
#----------------------------
        
FROM node:20-alpine AS build

#-----------------------INSTALL BUILD DEPENDENCIES FOR ARGON2
RUN apk add --no-cache \
    make \
    g++ \
    python3

ENV PYTHON=/usr/bin/python3

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
RUN apk add --no-cache \
    libstdc++ \
    sqlite \
    su-exec

# COPY entrypoint.sh /app/entrypoint.sh
# RUN chmod +x /app/entrypoint.sh

WORKDIR /app/auth

#-----------------------COPY NECESSARY FILES FROM PREVIOUS STEP
COPY --from=build /app/auth/package*.json ./
COPY --from=build /app/auth/node_modules ./node_modules
COPY --from=build /app/auth/dist ./dist

RUN mkdir -p /app/data

#-----------------------EXPOSE INTERNAL PORT
EXPOSE 3001

#-----------------------START PRODUCTION MODE
# ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
CMD ["node", "dist/index.js"]
