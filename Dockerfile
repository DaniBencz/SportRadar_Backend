FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY ./compiled .
COPY ./public ./public

EXPOSE 4040
CMD [ "node", "index.js" ]
