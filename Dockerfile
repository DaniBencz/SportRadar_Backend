FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# if using ci, mind the postinstall script
# RUN npm ci --unsafe-perm
RUN npm install

COPY . .

RUN npm run build

RUN rm -r src

# remove dev-dependencies from node_modules
# don't seem to reduce image size...
RUN npm prune --production

CMD [ "node", "compiled/index.js" ]
# for local container
# docker run --rm --env PORT=4000 -p 5000:4000 <image>
