FROM node:latest AS build
WORKDIR /usr/src/app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci --only=production


FROM node:21-alpine
WORKDIR /usr/src/app
# ENV NODE_ENV production

USER node
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

EXPOSE 3000
CMD ["node", "main.js"]
