#-----------------------NODE AND NPM INCLUDED
FROM node:20-alpine

#-----------------------DEFINE WORKING DIRECTORY
WORKDIR /app/gateway

#-----------------------COPY PACKAGE .JSON & PACKAGE-LOCK.JSON
COPY ./conf/package*.json ./

#-----------------------INSTALL DEPENDENCIES
RUN npm install

#-----------------------COPY SOURCE CODE
COPY . .

#-----------------------COMPILE TYPESCRIPT
RUN npm run build

#-----------------------EXPOSE INTERNAL PORT
EXPOSE 8080

#-----------------------START SERVER
CMD ["npm", "run", "start"]
# pour le moment le fichier index.js n'existe pas


