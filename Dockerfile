FROM node:10.15-alpine

LABEL name="retrowave-fs"
LABEL maintainer="Andrey Kravtsov <raidendev@gmail.com>"

ENV NODE_ENV=production

WORKDIR /opt/retrowave-fs/

RUN mkdir -p /var/data/retrowave-fs/download/audio/ && \
    mkdir -p /var/data/retrowave-fs/download/artwork/

RUN npm -g install pm2@3

COPY package.json package.json
RUN npm install

COPY bin/ bin/
COPY build/ build/
COPY conf/ conf/

VOLUME /var/data/retrowave-fs/upload/
VOLUME /var/data/retrowave-fs/download/

ENTRYPOINT ["pm2-runtime", "conf/ecosystem.config.js"]
