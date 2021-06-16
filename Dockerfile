FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
# if using ci, mind the postinstall script

COPY . .

RUN npm run build

RUN rm -r src

# COPY ./compiled .
# COPY ./public ./public

EXPOSE 4040
CMD [ "node", "compiled/index.js" ]
