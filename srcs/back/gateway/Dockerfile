#-----------------------NODE AND NPM INCLUDED
FROM node:20-alpine

#-----------------------DEFINE WORKING DIRECTORY
WORKDIR /app/gateway

#-----------------------COPY PACKAGE .JSON & PACKAGE-LOCK.JSON
COPY package*.json ./

#-----------------------INSTALL DEPENDENCIES
RUN npm install --production

#-----------------------COPY SOURCE CODE
COPY . .

#-----------------------EXPOSE INTERNAL PORT
EXPOSE 8080

#-----------------------START SERVER
CMD ["npm", "run", "start"]

