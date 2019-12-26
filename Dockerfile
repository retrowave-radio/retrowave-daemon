FROM node:10.15-alpine

LABEL maintainer="Andrey Kravtsov <raidendev@gmail.com>"

ARG name=retrowave-fproc

ENV NODE_ENV=production

WORKDIR /opt/${name}/

RUN mkdir -p /var/data/${name}/download/audio/ && \
    mkdir -p /var/data/${name}/download/artwork/

RUN npm -g install pm2@3

COPY package*.json ./
RUN npm install

COPY bin/ bin/
COPY build/ build/
COPY conf/ conf/

VOLUME /var/data/${name}/upload/
VOLUME /var/data/${name}/download/

ENTRYPOINT ["pm2-runtime", "conf/ecosystem.config.js"]
