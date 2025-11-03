#-----------------------NODE AND NPM INCLUDED
FROM node:20-alpine

#-----------------------DEFINE WORKING DIRECTORY
WORKDIR /app/chat

#-----------------------COPY PACKAGE .JSON & PACKAGE-LOCK.JSON
COPY package*.json ./

#-----------------------INSTALL DEPENDENCIES
RUN npm install --production

#-----------------------COPY SOURCE CODE
COPY . .

#-----------------------EXPOSE INTERNAL PORT
EXPOSE 3002

#-----------------------START SERVER
CMD ["npm", "run", "start"]