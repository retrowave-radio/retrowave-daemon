FROM node:10.15-alpine

LABEL name="retrowave-fs"
LABEL maintainer="Andrey Kravtsov <raidendev@gmail.com>"

ENV NODE_ENV=production
WORKDIR /opt/retrowave-fs/

COPY bin/ bin/
COPY build/ build/
COPY conf/ conf/
COPY package.json package.json

RUN mkdir -p /var/data/retrowave-fs/download/audio/ && \
    mkdir -p /var/data/retrowave-fs/download/artwork/

RUN npm -g install pm2@3
RUN npm install

VOLUME /var/data/retrowave-fs/upload/
VOLUME /var/data/retrowave-fs/download/

ENTRYPOINT ["pm2", "start", "--no-daemon", "conf/ecosystem.config.js"]
