FROM node:16-buster-slim

# install system dependencies
RUN apt-get update && apt-get install --no-install-recommends --yes \
    tini && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/src/app/node_modules && chown -R node:node /usr/src/app

WORKDIR /usr/src/app

# install node dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn install --production=false && yarn cache clean --all

# Bundle app source
COPY . .

# build project
RUN yarn build

EXPOSE 4000
CMD ["tini", "--", "yarn", "start"]
