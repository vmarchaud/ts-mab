FROM node:12.15-buster-slim AS base

MAINTAINER Team Reelevant <dev@reelevant.com>

ARG NPM_TOKEN
ARG COMMIT

ENV DOCKER_USER node
ENV HOME /home/$DOCKER_USER
ENV COMMIT=$COMMIT
ENV APP_NAME=tracking-ingester
ENV VERSION=$COMMIT
ENV GOOGLE_APPLICATION_CREDENTIALS /home/node/etc/key/gcp_key.json

RUN apt-get update && apt-get install curl git -y

RUN curl -L https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 -o /usr/local/bin/dumb-init 
RUN chmod +x /usr/local/bin/dumb-init

RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "${HOME}/.npmrc"

USER $DOCKER_USER

WORKDIR $HOME

ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]

FROM base as build

# install dependencies
COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY yarn.lock yarn.lock

RUN yarn --no-progress --no-interactive --frozen-lockfile

COPY src/ src/
COPY config/ config/

# build javascript code
RUN yarn run build

FROM base as release

# get back archive containing code & deps
COPY --from=build ${HOME}/build .
COPY package.json package.json
COPY yarn.lock yarn.lock

RUN yarn --production=true --no-progress --no-interactive --frozen-lockfile

CMD ["node", "-r", "source-map-support/register" ,"src/index.js"]
